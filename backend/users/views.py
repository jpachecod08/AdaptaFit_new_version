# users/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework.settings import api_settings
from .serializers import EntrenadorListSerializer
from django.db.models import Q
from rest_framework import generics
from .models import CustomUser, PasswordResetCode
from django.http import JsonResponse

# AÑADE ESTOS IMPORTS NUEVOS:
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password
import json

from workouts.views import generar_y_guardar_plan
from workouts.models import WorkoutPlan
from users.models import UserProfile

from .serializers import CustomUserSerializer, TrainerRegisterSerializer, AuthTokenSerializer

User = get_user_model()

# ----------------------------------------------------------------------
# VISTAS DE RECUPERACIÓN DE CONTRASEÑA
# ----------------------------------------------------------------------
@csrf_exempt
@require_POST
def password_reset_request(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'El correo electrónico es requerido'}, status=400)
        
        # Verificar si el usuario existe
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Por seguridad, no revelamos si el email existe o no
            return JsonResponse({'message': 'Si el email existe, se enviará un código de recuperación'})
        
        # Generar y guardar código
        reset_code = PasswordResetCode.generate_code(email, user.id)
        
        # Enviar email (configura esto según tu servidor de email)
        try:
            send_mail(
                'Código de Recuperación - AdaptaFit',
                f'Tu código de recuperación es: {reset_code.code}\n\nEste código expirará en 15 minutos.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            print(f"[PASSWORD_RESET] Código {reset_code.code} enviado a {email}")
        except Exception as e:
            print(f"Error enviando email: {e}")
            # Para desarrollo, devolvemos el código en la respuesta
            return JsonResponse({
                'message': 'Código de recuperación generado (email no enviado)',
                'debug_code': reset_code.code  # Solo para desarrollo
            })
        
        return JsonResponse({'message': 'Código de recuperación enviado'})
        
    except Exception as e:
        print(f"Error en password_reset_request: {e}")
        return JsonResponse({'error': 'Error interno del servidor'}, status=500)

@csrf_exempt
@require_POST
def password_reset_verify(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        code = data.get('code')
        
        if not email or not code:
            return JsonResponse({'error': 'Email y código son requeridos'}, status=400)
        
        # Verificar código en la base de datos
        reset_code = PasswordResetCode.get_valid_code(email, code)
        
        if not reset_code:
            return JsonResponse({'error': 'Código expirado o inválido'}, status=400)
        
        # Marcar código como verificado
        reset_code.verified = True
        reset_code.save()
        
        return JsonResponse({'message': 'Código verificado correctamente'})
        
    except Exception as e:
        print(f"Error en password_reset_verify: {e}")
        return JsonResponse({'error': 'Error interno del servidor'}, status=500)

@csrf_exempt
@require_POST
def password_reset_confirm(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        code = data.get('code')
        new_password = data.get('new_password')
        
        if not email or not code or not new_password:
            return JsonResponse({'error': 'Todos los campos son requeridos'}, status=400)
        
        if len(new_password) < 6:
            return JsonResponse({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=400)
        
        # Verificar código en la base de datos
        reset_code = PasswordResetCode.get_valid_code(email, code)
        
        if not reset_code or not reset_code.verified:
            return JsonResponse({'error': 'Código no verificado o inválido'}, status=400)
        
        # Actualizar contraseña del usuario
        try:
            user = User.objects.get(id=reset_code.user_id)
            user.password = make_password(new_password)
            user.save()
        except User.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
        
        # Eliminar código usado
        reset_code.delete()
        
        return JsonResponse({'message': 'Contraseña actualizada correctamente'})
        
    except Exception as e:
        print(f"Error en password_reset_confirm: {e}")
        return JsonResponse({'error': 'Error interno del servidor'}, status=500)

# ----------------------------------------------------------------------
# VISTA DE LOGIN CORREGIDA
# ----------------------------------------------------------------------
class LoginView(APIView):
    """
    Vista para el login. Utiliza el serializador AuthTokenSerializer para validar
    credenciales y devuelve un token de autenticación junto con los datos del usuario.
    """
    permission_classes = [AllowAny]
    serializer_class = AuthTokenSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'tipo_usuario': user.role,
        }, status=status.HTTP_200_OK)


# ----------------------------------------------------------------------
# VISTAS DE REGISTRO
# ----------------------------------------------------------------------
class UserRegisterView(generics.CreateAPIView):
    """
    Vista para registrar un nuevo usuario normal.
    """
    permission_classes = [AllowAny] 
    serializer_class = CustomUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "¡Registro de usuario exitoso! Por favor, inicia sesión.", "user": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class TrainerRegisterView(generics.CreateAPIView):
    """
    Vista para registrar un nuevo entrenador.
    """
    permission_classes = [AllowAny]
    serializer_class = TrainerRegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "¡Registro de entrenador exitoso! Por favor, inicia sesión.", "user": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

# ----------------------------------------------------------------------
# VISTA DE PERFIL CON REGENERACIÓN AUTOMÁTICA DE PLAN
# ----------------------------------------------------------------------
class UserProfileView(APIView):
    """
    Vista para obtener y actualizar el perfil del usuario autenticado.
    Ahora incluye regeneración automática del plan si cambia la frecuencia.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = CustomUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        try:
            user = request.user
            data = request.data
            
            print(f"[USER_PROFILE_UPDATE] Actualizando perfil para usuario {user.id}")
            print(f"[USER_PROFILE_UPDATE] Datos recibidos: {data}")
            
            # Obtener frecuencia anterior ANTES de actualizar
            try:
                user_profile = UserProfile.objects.get(user=user)
                frecuencia_anterior = user_profile.frecuencia
                print(f"[USER_PROFILE_UPDATE] Frecuencia anterior: {frecuencia_anterior}")
            except UserProfile.DoesNotExist:
                user_profile = None
                frecuencia_anterior = None
                print(f"[USER_PROFILE_UPDATE] No se encontró perfil para el usuario")
            
            # Usar el serializer para validar y actualizar
            serializer = CustomUserSerializer(user, data=request.data, partial=True)
            
            if not serializer.is_valid():
                print(f"[USER_PROFILE_UPDATE] Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Guardar los cambios del usuario
            updated_user = serializer.save()
            print(f"[USER_PROFILE_UPDATE] Perfil actualizado exitosamente")
            
            # VERIFICAR SI CAMBIÓ LA FRECUENCIA Y REGENERAR PLAN
            profile_data = data.get('profile', {})
            frecuencia_nueva = profile_data.get('frecuencia')
            
            print(f"[USER_PROFILE_UPDATE] Frecuencia nueva recibida: {frecuencia_nueva}")
            
            if frecuencia_nueva is not None and user_profile:
                try:
                    frecuencia_nueva = int(frecuencia_nueva)
                    print(f"[USER_PROFILE_UPDATE] Comparando frecuencia: {frecuencia_anterior} vs {frecuencia_nueva}")
                    
                    if frecuencia_anterior != frecuencia_nueva:
                        print(f"[USER_PROFILE_UPDATE] Frecuencia cambió de {frecuencia_anterior} a {frecuencia_nueva}. Regenerando plan...")
                        
                        # Buscar y eliminar plan existente
                        plan_existente = WorkoutPlan.objects.filter(user=user).order_by('-generated_at').first()
                        if plan_existente:
                            plan_existente.delete()
                            print(f"[USER_PROFILE_UPDATE] Plan anterior eliminado (ID: {plan_existente.id})")
                        else:
                            print(f"[USER_PROFILE_UPDATE] No se encontró plan existente para eliminar")
                        
                        # Generar nuevo plan
                        nuevo_plan = generar_y_guardar_plan(user)
                        if nuevo_plan:
                            print(f"[USER_PROFILE_UPDATE] Nuevo plan generado exitosamente con {nuevo_plan.days.count()} días (ID: {nuevo_plan.id})")
                        else:
                            print(f"[USER_PROFILE_UPDATE] Error: No se pudo generar nuevo plan")
                            
                except ValueError as e:
                    print(f"[USER_PROFILE_UPDATE] Error al convertir frecuencia: {e}")
                except Exception as e:
                    print(f"[USER_PROFILE_UPDATE] Error al regenerar plan: {e}")
                    # Continuamos aunque falle la regeneración del plan
            else:
                print(f"[USER_PROFILE_UPDATE] No hay cambios de frecuencia o no hay perfil")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"[USER_PROFILE_UPDATE] Error general: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ----------------------------------------------------------------------
# VISTA DE LISTA DE ENTRENADORES
# ----------------------------------------------------------------------
class EntrenadorListView(generics.ListAPIView):
    serializer_class = EntrenadorListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CustomUser.objects.filter(
            trainer_profile__isnull=False,
            is_active=True
        ).select_related('trainer_profile').order_by('-date_joined')

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(trainer_profile__especialidad__icontains=search) |
                Q(trainer_profile__certificaciones__icontains=search)
            )

        return queryset