"""Panel de administración de AdaptaFit.

Todos los endpoints de este módulo exigen el permiso de administrador
(`user.is_admin`, es decir `es_admin` o el rol legacy `admin`).

El registro público sigue permitiendo crear clientes, pero ya nadie se puede
autoasignar el rol de entrenador: eso lo hace únicamente el administrador
desde acá. Se registra cada acción en AdminAction para dejar rastro de quién
dió de baja, creó o eliminó a cada usuario.
"""
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import serializers, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AdminAction, TrainerProfile

CustomUser = get_user_model()

ROLES_PERMITIDOS = ('usuario', 'entrenador', 'admin')

# Campos que un entrenador puede traer. Solo aplica si role == 'entrenador'.
CAMPOS_ENTRENADOR = ('especialidad', 'anos_experiencia', 'telefono', 'biografia', 'certificaciones')


# ---------------------------------------------------------------------------
# AUTORIZACIÓN
# ---------------------------------------------------------------------------
def _es_admin(user):
    return bool(user) and user.is_admin


def admin_required(view):
    """Bloquea el endpoint si el usuario no es administrador."""
    def wrapper(request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Autenticación requerida.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not _es_admin(request.user):
            return Response({'error': 'Se requieren permisos de administrador.'},
                            status=status.HTTP_403_FORBIDDEN)
        return view(request, *args, **kwargs)
    return wrapper


def _admins_restantes(excluir_id=None):
    """Cuenta los administradores **activos** del sistema (sin `excluir_id`).

    Solo los activos cuentan: si contáramos también a los desactivados, un
    administrador podría desactivarse a sí mismo mientras existe otro admin
    ya dado de baja y el sistema quedaría sin nadie que pueda entrar.
    """
    qs = CustomUser.objects.filter(
        Q(es_admin=True) | Q(role='admin') | Q(is_staff=True) | Q(is_superuser=True),
        is_active=True,
    )
    if excluir_id:
        qs = qs.exclude(pk=excluir_id)
    return qs.count()


def _log(actor, action, target=None, detail='', target_id=None):
    """Guarda una acción de administración.

    `target` puede ser un usuario o, si ya no existe (se eliminó), un email
    en texto para que el historial siga siendo legible.
    """
    if hasattr(target, 'email'):
        target_email, target_pk = target.email, target.pk
    else:
        target_email, target_pk = (target or ''), target_id

    AdminAction.objects.create(
        actor=actor if actor.is_authenticated else None,
        actor_email=actor.email if actor else '',
        action=action,
        target=target_email,
        target_id=target_pk,
        detail=detail,
    )


def _cerrar_sesiones(user):
    """Elimina el token del usuario para que sus sesiones abiertas mueran ya.

    Sin esto, desactivar la cuenta solo evita logins nuevos: el token que el
    usuario tenga en el navegador seguiría sirviendo.
    """
    from rest_framework.authtoken.models import Token
    Token.objects.filter(user=user).delete()


# ---------------------------------------------------------------------------
# SERIALIZERS
# ---------------------------------------------------------------------------
class AdminUserCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=ROLES_PERMITIDOS, default='usuario')

    # Campos opcionales del entrenador
    especialidad = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    anos_experiencia = serializers.IntegerField(required=False, allow_null=True, default=None)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    biografia = serializers.CharField(required=False, allow_blank=True, default='')
    certificaciones = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('Este correo electrónico ya está registrado.')
        return value.lower().strip()


def _fila_usuario(u):
    """Resumen de un usuario para el panel: rol, estado y carga de trabajo."""
    from workouts.models import ClientAssignment, SessionLog

    perfil = getattr(u, 'profile', None)
    trainer = perfil.trainer if perfil else None

    fila = {
        'id': u.id,
        'nombre': u.display_name,
        'email': u.email,
        'role': u.role,
        'es_admin': u.is_admin,
        'is_active': u.is_active,
        'date_joined': u.date_joined.strftime('%d/%m/%Y') if u.date_joined else '',
        'ultimo_acceso': u.last_login.strftime('%d/%m/%Y %H:%M') if u.last_login else None,
        'entrenador': (trainer.email if trainer else None),
        'especialidad': None,
        'clientes_activos': 0,
        'clientes_total': 0,
        'sesiones_completadas': 0,
    }

    if u.role == 'entrenador':
        perfil_entrenador = getattr(u, 'trainer_profile', None)
        if perfil_entrenador:
            fila['especialidad'] = perfil_entrenador.especialidad
        activos = ClientAssignment.objects.filter(trainer=u, is_active=True).count()
        total = ClientAssignment.objects.filter(trainer=u).count()
        fila['clientes_activos'] = activos
        fila['clientes_total'] = total
    elif u.role == 'usuario':
        fila['clientes_activos'] = ClientAssignment.objects.filter(client=u, is_active=True).count()
        fila['sesiones_completadas'] = SessionLog.objects.filter(
            assignment__client=u, is_completed=True).count()

    return fila


# ---------------------------------------------------------------------------
# 1) LISTAR USUARIOS + ESTADÍSTICAS
# ---------------------------------------------------------------------------
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
@admin_required
def admin_users(request):
    rol_filtro = request.query_params.get('role', '').strip()

    qs = CustomUser.objects.all().select_related('profile', 'trainer_profile').order_by('role', 'email')
    if rol_filtro in ROLES_PERMITIDOS:
        qs = qs.filter(role=rol_filtro)

    usuarios = [_fila_usuario(u) for u in qs]

    total_admins = _admins_restantes()
    for fila in usuarios:
        fila['es_ultimo_admin'] = bool(fila['es_admin']) and total_admins <= 1

    stats = {
        'total': CustomUser.objects.count(),
        'activos': CustomUser.objects.filter(is_active=True).count(),
        'inactivos': CustomUser.objects.filter(is_active=False).count(),
        'usuarios': CustomUser.objects.filter(role='usuario').count(),
        'entrenadores': CustomUser.objects.filter(role='entrenador').count(),
        'admins': total_admins,
        'sin_entrenador': sum(1 for f in usuarios if f['role'] == 'usuario' and not f['entrenador']),
    }
    return Response({'stats': stats, 'users': usuarios})


# ---------------------------------------------------------------------------
# 2) CREAR USUARIO / ENTRENADOR
# ---------------------------------------------------------------------------
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
@admin_required
def admin_create_user(request):
    serializer = AdminUserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    datos = serializer.validated_data

    rol = datos.get('role', 'usuario')
    if rol not in ROLES_PERMITIDOS:
        return Response({'error': 'Rol no válido.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        user = CustomUser.objects.create_user(
            email=datos['email'],
            password=datos['password'],
            role=rol,
            nombre=datos.get('nombre', ''),
        )

        if rol == 'entrenador':
            TrainerProfile.objects.create(
                user=user,
                especialidad=datos.get('especialidad') or 'General',
                anosExperiencia=datos.get('anos_experiencia'),
                telefono=datos.get('telefono') or None,
                biografia=datos.get('biografia') or None,
                certificaciones=datos.get('certificaciones') or None,
            )
        else:
            from .models import UserProfile
            UserProfile.objects.create(user=user)

    _log(request.user, 'create_trainer' if rol == 'entrenador' else 'create_user',
         user, f'Creado con rol {rol}')

    return Response({
        'message': f"{'Entrenador' if rol == 'entrenador' else 'Usuario'} creado correctamente.",
        'user': _fila_usuario(user),
    }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# 3) CAMBIAR ESTADO / ROL / CONTRASEÑA
# ---------------------------------------------------------------------------
@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
@admin_required
def admin_update_user(request, user_id):
    try:
        objetivo = CustomUser.objects.select_related('trainer_profile').get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    avisos = []
    accion = ''
    detalle = ''

    # --- Activar / desactivar ---
    if 'is_active' in request.data:
        nuevo_estado = bool(request.data['is_active'])

        if not nuevo_estado and objetivo.is_admin and _admins_restantes(excluir_id=objetivo.pk) < 1:
            return Response(
                {'error': 'No puedes desactivar al último administrador. '
                          'Crea otro administrador antes de continuar.'},
                status=status.HTTP_400_BAD_REQUEST)

        objetivo.is_active = nuevo_estado
        objetivo.save(update_fields=['is_active'])
        accion = 'activate' if nuevo_estado else 'deactivate'
        detalle = f"Cuenta {'activada' if nuevo_estado else 'desactivada'}"

        if not nuevo_estado and objetivo.role == 'entrenador':
            from workouts.models import ClientAssignment
            clientes = ClientAssignment.objects.filter(trainer=objetivo, is_active=True).count()
            if clientes:
                avisos.append(
                    f'{clientes} cliente(s) siguen asignados a este entrenador. '
                    'Puedes reasignarlos o dejarlos sin rutina activa.')

        # Un token ya emitido deja de servir en cuanto se desactiva la cuenta
        if not nuevo_estado:
            _cerrar_sesiones(objetivo)

    # --- Cambiar rol ---
    if 'role' in request.data:
        nuevo_rol = request.data['role']
        if nuevo_rol not in ROLES_PERMITIDOS:
            return Response({'error': 'Rol no válido.'}, status=status.HTTP_400_BAD_REQUEST)

        if objetivo.role == 'admin' and nuevo_rol != 'admin' and _admins_restantes(excluir_id=objetivo.pk) < 1:
            return Response(
                {'error': 'No puedes quitarle el rol de administrador al último administrador.'},
                status=status.HTTP_400_BAD_REQUEST)

        if not objetivo.is_active and nuevo_rol != 'admin':
            return Response(
                {'error': 'Este usuario está desactivado. Actívalo antes de cambiarle el rol.'},
                status=status.HTTP_400_BAD_REQUEST)

        rol_anterior = objetivo.role
        objetivo.role = nuevo_rol
        objetivo.save(update_fields=['role'])
        accion = accion or 'set_role'
        detalle = f'Rol {rol_anterior} → {nuevo_rol}'
        avisos.append(_aviso_cambio_rol(objetivo, rol_anterior, nuevo_rol))

    # --- Dar / quitar permiso de administrador (independiente del rol) ---
    if 'es_admin' in request.data:
        nuevo_permiso = bool(request.data['es_admin'])

        if not nuevo_permiso:
            if request.user.pk == objetivo.pk:
                return Response(
                    {'error': 'No puedes quitarte a ti mismo los permisos de administrador.'},
                    status=status.HTTP_400_BAD_REQUEST)
            if objetivo.is_admin and _admins_restantes(excluir_id=objetivo.pk) < 1:
                return Response(
                    {'error': 'No puedes quitarle los permisos al último administrador. '
                              'Otorga el permiso a otra persona antes de continuar.'},
                    status=status.HTTP_400_BAD_REQUEST)
        elif not objetivo.is_active:
            return Response(
                {'error': 'Este usuario está desactivado. Actívalo antes de darle permisos de administrador.'},
                status=status.HTTP_400_BAD_REQUEST)

        campos = ['es_admin']
        objetivo.es_admin = nuevo_permiso
        # Compatibilidad: un admin con el rol legacy 'admin' pasa a 'usuario'
        # al perder el permiso, para no dejar un rol reservado activo.
        if not nuevo_permiso and objetivo.role == 'admin':
            objetivo.role = 'usuario'
            campos.append('role')
        objetivo.save(update_fields=campos)
        accion = accion or ('grant_admin' if nuevo_permiso else 'revoke_admin')
        detalle = detalle or (
            'Permisos de administrador otorgados' if nuevo_permiso
            else 'Permisos de administrador retirados')
        if not nuevo_permiso and 'role' in campos:
            detalle += ' (rol admin → usuario)'

    # --- Nueva contraseña ---
    if request.data.get('password'):
        if len(str(request.data['password'])) < 8:
            return Response({'error': 'La contraseña debe tener al menos 8 caracteres.'},
                            status=status.HTTP_400_BAD_REQUEST)
        objetivo.set_password(request.data['password'])
        objetivo.save()
        _cerrar_sesiones(objetivo)
        accion = accion or 'reset_password'
        detalle = 'Contraseña restablecida por el administrador.'
        avisos.append('Se cerraron las sesiones activas de este usuario.')

    if not accion:
        return Response({'error': 'No se recibió ningún cambio.'}, status=status.HTTP_400_BAD_REQUEST)

    _log(request.user, accion, objetivo, detalle)

    return Response({
        'message': 'Cambio aplicado correctamente.',
        'user': _fila_usuario(objetivo),
        'warnings': [a for a in avisos if a],
    })


def _aviso_cambio_rol(user, rol_anterior, nuevo_rol):
    """Previene errores comunes al mover un usuario de rol."""
    if rol_anterior == 'entrenador' and nuevo_rol != 'entrenador':
        from workouts.models import ClientAssignment
        clientes = ClientAssignment.objects.filter(trainer=user, is_active=True).count()
        if clientes:
            return (f'Se le quitó el rol de entrenador, pero sigue teniendo {clientes} '
                    'cliente(s) asignados. Quedarán sin entrenador activo.')
    if nuevo_rol == 'entrenador' and not hasattr(user, 'trainer_profile'):
        TrainerProfile.objects.create(user=user, especialidad='General')
        return 'Se le creó un perfil de entrenador por defecto (especialidad: General).'
    return ''


# ---------------------------------------------------------------------------
# 4) ELIMINAR USUARIO (definitivo)
# ---------------------------------------------------------------------------
@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
@admin_required
def admin_delete_user(request, user_id):
    if request.user.pk == user_id:
        return Response({'error': 'No puedes eliminar tu propia cuenta.'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        objetivo = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if objetivo.is_admin and _admins_restantes(excluir_id=objetivo.pk) < 1:
        return Response({'error': 'No puedes eliminar al último administrador.'},
                        status=status.HTTP_400_BAD_REQUEST)

    email = objetivo.email
    rol = objetivo.role

    try:
        with transaction.atomic():
            objetivo.delete()
    except ProtectedError:
        return Response({
            'error': 'No se puede eliminar: sus rutinas siguen asignadas a clientes. '
                     'Desactívalo en lugar de eliminarlo, o reasigna esas rutinas primero.'
        }, status=status.HTTP_409_CONFLICT)
    except Exception as exc:  # pragma: no cover - defensa
        return Response({'error': f'No se pudo eliminar: {exc}'},
                        status=status.HTTP_409_CONFLICT)

    _log(request.user, 'delete_user', email, f'Cuenta eliminada (rol {rol}).')
    return Response({'message': f'Cuenta {email} eliminada permanentemente.'})


# ---------------------------------------------------------------------------
# 5) HISTORIAL DE ACCIONES
# ---------------------------------------------------------------------------
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
@admin_required
def admin_activity(request):
    limite = int(request.query_params.get('limit', 50) or 50)
    qs = AdminAction.objects.all()[:max(1, min(limite, 200))]
    return Response([
        {
            'id': a.id,
            'actor': a.actor_email,
            'action': a.action,
            'target': a.target,
            'detail': a.detail,
            'fecha': a.created_at.strftime('%d/%m/%Y %H:%M'),
        }
        for a in qs
    ])
