# users/views.py - COMPLETO Y CORREGIDO

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
import json
import logging

from .models import CustomUser, UserProfile, TrainerProfile, PasswordResetCode
from .serializers import (
    CustomUserSerializer, 
    TrainerRegisterSerializer, 
    AuthTokenSerializer,
    EntrenadorListSerializer,
    AvailableTrainerSerializer,
    AssignTrainerSerializer,
    AssignedTrainerSerializer
)
from workouts.views import generar_y_guardar_plan
# CORREGIDO: Importar los modelos correctos de workouts
from workouts.models import WorkoutPlan, WorkoutDay, WorkoutExercise, UserProgress

# Configurar logger
logger = logging.getLogger(__name__)

# Obtener modelo de usuario
User = get_user_model()

# ----------------------------------------------------------------------
# FUNCIONES HELPER
# ----------------------------------------------------------------------

def calculate_user_streak(user):
    """Helper para calcular la racha de días consecutivos"""
    today = timezone.now().date()
    streak = 0
    
    # Verificar días hacia atrás usando UserProgress (que es tu CompletedExercise)
    for i in range(30):  # Últimos 30 días máximo
        check_date = today - timedelta(days=i)
        has_activity = UserProgress.objects.filter(
            user=user,
            completed_at__date=check_date,
            completed=True
        ).exists()
        
        if has_activity:
            streak += 1
        else:
            break
    
    return streak

def get_user_stats_for_trainer(user):
    """Helper para obtener stats de un usuario"""
    # Obtener ejercicios completados hoy usando UserProgress
    today = timezone.now().date()
    completed_today = UserProgress.objects.filter(
        user=user,
        completed_at__date=today,
        completed=True
    ).count()
    
    # Calcular racha
    streak = calculate_user_streak(user)
    
    # Total de ejercicios en el plan actual
    plan = WorkoutPlan.objects.filter(user=user).first()
    total_exercises = 0
    if plan:
        for day in plan.workout_days.all():  # Cambiado a workout_days
            total_exercises += day.workout_exercises.count()  # Cambiado a workout_exercises
    
    # Última actividad
    last_completed = UserProgress.objects.filter(
        user=user,
        completed=True
    ).order_by('-completed_at').first()
    
    last_activity = last_completed.completed_at if last_completed else None
    
    # Verificar si necesita atención (sin actividad en 3+ días)
    needs_attention = False
    if last_activity:
        days_inactive = (timezone.now() - last_activity).days
        needs_attention = days_inactive >= 3
    else:
        needs_attention = True
    
    return {
        'total_exercises': total_exercises,
        'completed_today': completed_today,
        'current_streak': streak,
        'total_points': user.total_points if hasattr(user, 'total_points') else 0,
        'last_activity': last_activity,
        'needs_attention': needs_attention,
    }

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
            response = JsonResponse({'error': 'El correo electrónico es requerido'}, status=400)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Verificar si el usuario existe
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Por seguridad, no revelamos si el email existe o no
            response = JsonResponse({'message': 'Si el email existe, se enviará un código de recuperación'})
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Generar y guardar código
        reset_code = PasswordResetCode.generate_code(email, user.id)
        
        # Enviar email
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
            response = JsonResponse({
                'message': 'Código de recuperación generado (email no enviado)',
                'debug_code': reset_code.code  # Solo para desarrollo
            })
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        response = JsonResponse({'message': 'Código de recuperación enviado'})
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    except Exception as e:
        print(f"Error en password_reset_request: {e}")
        response = JsonResponse({'error': 'Error interno del servidor'}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

@csrf_exempt
@require_POST
def password_reset_verify(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        code = data.get('code')
        
        if not email or not code:
            response = JsonResponse({'error': 'Email y código son requeridos'}, status=400)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Verificar código en la base de datos
        reset_code = PasswordResetCode.get_valid_code(email, code)
        
        if not reset_code:
            response = JsonResponse({'error': 'Código expirado o inválido'}, status=400)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Marcar código como verificado
        reset_code.verified = True
        reset_code.save()
        
        response = JsonResponse({'message': 'Código verificado correctamente'})
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    except Exception as e:
        print(f"Error en password_reset_verify: {e}")
        response = JsonResponse({'error': 'Error interno del servidor'}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

@csrf_exempt
@require_POST
def password_reset_confirm(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        code = data.get('code')
        new_password = data.get('new_password')
        
        if not email or not code or not new_password:
            response = JsonResponse({'error': 'Todos los campos son requeridos'}, status=400)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        if len(new_password) < 6:
            response = JsonResponse({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=400)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Verificar código en la base de datos
        reset_code = PasswordResetCode.get_valid_code(email, code)
        
        if not reset_code or not reset_code.verified:
            response = JsonResponse({'error': 'Código no verificado o inválido'}, status=400)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Actualizar contraseña del usuario
        try:
            user = User.objects.get(id=reset_code.user_id)
            user.password = make_password(new_password)
            user.save()
        except User.DoesNotExist:
            response = JsonResponse({'error': 'Usuario no encontrado'}, status=404)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Eliminar código usado
        reset_code.delete()
        
        response = JsonResponse({'message': 'Contraseña actualizada correctamente'})
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    except Exception as e:
        print(f"Error en password_reset_confirm: {e}")
        response = JsonResponse({'error': 'Error interno del servidor'}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

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
            'nombre': user.nombre if hasattr(user, 'nombre') else user.email.split('@')[0]
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
                            print(f"[USER_PROFILE_UPDATE] Nuevo plan generado exitosamente con {nuevo_plan.workout_days.count()} días (ID: {nuevo_plan.id})")
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

# ========== FUNCIÓN USER_ROLE ==========
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_role(request):
    """
    Obtener información del rol del usuario
    GET /api/users/user-role/
    """
    try:
        user = request.user
        logger.info(f"📥 Obteniendo rol para: {user.email}")
        
        is_trainer = user.role == 'entrenador' or hasattr(user, 'trainer_profile')
        
        response_data = {
            'role': user.role,
            'is_trainer': is_trainer,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'username': user.email,
            'email': user.email,
            'nombre': user.nombre,
            'user_id': user.id
        }
        
        logger.info(f"✅ Datos de rol: {response_data}")
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"❌ Error en user_role: {str(e)}")
        return Response({
            'role': 'usuario',
            'is_trainer': False,
            'is_superuser': False,
            'is_staff': False,
            'error': str(e)
        }, status=200)

# ========== FUNCIÓN UPDATE_PROFILE ==========
@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Actualizar perfil del usuario
    PUT /api/users/update-profile/
    """
    try:
        user = request.user
        logger.info(f"📥 Actualizando perfil para: {user.email}")
        
        # Determinar qué serializer usar
        if user.role == 'entrenador' or hasattr(user, 'trainer_profile'):
            # Es entrenador
            from .serializers import TrainerRegisterSerializer
            serializer = TrainerRegisterSerializer(user, data=request.data, partial=True)
        else:
            # Es usuario normal
            from .serializers import CustomUserSerializer
            serializer = CustomUserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"✅ Perfil actualizado para: {user.email}")
            return Response({
                'success': 'Perfil actualizado correctamente',
                'user': serializer.data
            })
        else:
            logger.error(f"❌ Errores al actualizar perfil: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"❌ Error en update_profile: {str(e)}")
        return Response(
            {'error': 'Error al actualizar el perfil'},
            status=status.HTTP_400_BAD_REQUEST
        )

# ========== FUNCIÓN CHANGE_PASSWORD ==========
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Cambiar contraseña (usuario autenticado)
    POST /api/users/change-password/
    """
    try:
        user = request.user
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'Contraseña actual y nueva contraseña son requeridas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar contraseña actual
        if not user.check_password(current_password):
            return Response(
                {'error': 'Contraseña actual incorrecta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar nueva contraseña
        if len(new_password) < 6:
            return Response(
                {'error': 'La nueva contraseña debe tener al menos 6 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar contraseña
        user.set_password(new_password)
        user.save()
        
        # Crear nuevo token (invalidar el anterior)
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)
        
        logger.info(f"✅ Contraseña cambiada para {user.email}")
        
        return Response({
            'success': 'Contraseña cambiada correctamente',
            'token': new_token.key
        })
        
    except Exception as e:
        logger.error(f"❌ Error en change_password: {str(e)}")
        return Response(
            {'error': 'Error al cambiar contraseña'},
            status=status.HTTP_400_BAD_REQUEST
        )

# ----------------------------------------------------------------------
# VISTAS PARA ENTRENADORES
# ----------------------------------------------------------------------

# 1. Obtener clientes del entrenador
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trainer_clients(request):
    """Obtener todos los clientes asignados a este entrenador"""
    user = request.user
    
    # Verificar que sea entrenador
    if not (user.is_staff or user.role == 'entrenador'):
        return Response({'error': 'No autorizado'}, status=403)
    
    # Obtener clientes asignados - primero intenta con UserProfile.trainer
    try:
        client_profiles = UserProfile.objects.filter(trainer=user)
        clients = [profile.user for profile in client_profiles]
    except:
        # Si no hay relación entrenador-cliente, devolver lista vacía
        clients = []
    
    client_data = []
    for client in clients:
        # Obtener plan del cliente
        plan = WorkoutPlan.objects.filter(user=client).first()
        
        # Obtener estadísticas
        stats = get_user_stats_for_trainer(client)
        
        # Obtener perfil del cliente
        try:
            user_profile = UserProfile.objects.get(user=client)
            frecuencia = user_profile.frecuencia
        except UserProfile.DoesNotExist:
            frecuencia = 3
        
        client_data.append({
            'id': client.id,
            'name': client.nombre or f"{client.first_name} {client.last_name}" or client.email.split('@')[0],
            'email': client.email,
            'plan_id': plan.id if plan else None,
            'plan_name': plan.title if plan else 'Sin plan',
            'frequency': frecuencia,
            'total_exercises': stats.get('total_exercises', 0),
            'completed_today': stats.get('completed_today', 0),
            'last_activity': stats.get('last_activity'),
            'current_streak': stats.get('current_streak', 0),
            'total_points': stats.get('total_points', 0),
            'status': 'active' if stats.get('current_streak', 0) > 0 else 'inactive',
            'needs_attention': stats.get('needs_attention', False),
            'upcoming_call': None,
        })
    
    return Response(client_data)

# 2. Obtener detalles de un cliente específico
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_client_details(request, client_id):
    """Obtener detalles específicos de un cliente"""
    user = request.user
    
    if not (user.is_staff or user.role == 'entrenador'):
        return Response({'error': 'No autorizado'}, status=403)
    
    try:
        client = CustomUser.objects.get(id=client_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Cliente no encontrado'}, status=404)
    
    # Verificar si el cliente está asignado a este entrenador
    try:
        user_profile = UserProfile.objects.get(user=client)
        if hasattr(user_profile, 'trainer') and user_profile.trainer != user:
            return Response({'error': 'Cliente no asignado a este entrenador'}, status=403)
    except UserProfile.DoesNotExist:
        pass  # No hay perfil, pero permitimos verlo si el entrenador tiene acceso
    
    # Obtener plan actual
    plan = WorkoutPlan.objects.filter(user=client).first()
    plan_data = None
    if plan:
        plan_data = {
            'id': plan.id,
            'title': plan.title,
            'description': plan.notes if plan.notes else 'Sin descripción',
            'days': []
        }
        
        for day in plan.workout_days.all():  # Cambiado a workout_days
            day_data = {
                'day_number': day.day_index,  # Cambiado a day_index
                'name': day.name or f"Día {day.day_index}",
                'exercises': []
            }
            for exercise in day.workout_exercises.all():  # Cambiado a workout_exercises
                day_data['exercises'].append({
                    'id': exercise.id,
                    'name': exercise.name,
                    'sets': exercise.sets,
                    'reps': exercise.reps,
                    'rest_time': exercise.rest_seconds,  # Cambiado a rest_seconds
                    'notes': exercise.notes
                })
            plan_data['days'].append(day_data)
    
    # Obtener historial de entrenamiento usando UserProgress
    history = UserProgress.objects.filter(user=client, completed=True).order_by('-completed_at')[:20]
    
    # Obtener perfil del cliente
    try:
        user_profile = UserProfile.objects.get(user=client)
        profile_data = {
            'fecha_nacimiento': user_profile.fechaNacimiento,
            'genero': user_profile.genero,
            'altura': user_profile.altura,
            'peso': user_profile.peso,
            'objetivo': user_profile.objetivo,
            'experiencia': user_profile.experiencia,
            'frecuencia': user_profile.frecuencia,
            'lesiones': user_profile.lesiones
        }
    except UserProfile.DoesNotExist:
        profile_data = {}
    
    return Response({
        'client': {
            'id': client.id,
            'email': client.email,
            'nombre': client.nombre,
            'first_name': client.first_name,
            'last_name': client.last_name,
            'date_joined': client.date_joined,
            'last_login': client.last_login,
            'profile': profile_data
        },
        'current_plan': plan_data,
        'stats': get_user_stats_for_trainer(client),
        'recent_workouts': [
            {
                'date': item.completed_at,
                'exercise_name': item.exercise.name if item.exercise else 'Desconocido',
                'completed': item.completed,
                'notes': f"Completado el {item.completed_at.strftime('%Y-%m-%d %H:%M')}" if item.completed_at else ''
            }
            for item in history
        ]
    })

# 3. Actualizar plan de cliente
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_client_plan(request, client_id):
    """Permite al entrenador actualizar el plan de un cliente"""
    user = request.user
    
    if not (user.is_staff or user.role == 'entrenador'):
        return Response({'error': 'No autorizado'}, status=403)
    
    try:
        client = CustomUser.objects.get(id=client_id)
        # Verificar relación entrenador-cliente
        try:
            user_profile = UserProfile.objects.get(user=client)
            if hasattr(user_profile, 'trainer') and user_profile.trainer != user:
                return Response({'error': 'Cliente no asignado a este entrenador'}, status=403)
        except UserProfile.DoesNotExist:
            pass
    except CustomUser.DoesNotExist:
        return Response({'error': 'Cliente no encontrado'}, status=404)
    
    data = request.data
    
    # Verificar si se debe generar un nuevo plan
    if data.get('action') == 'regenerate':
        # Generar nuevo plan
        plan = generar_y_guardar_plan(client)
        
        return Response({
            'message': 'Plan regenerado exitosamente',
            'plan_id': plan.id if plan else None
        })
    
    elif data.get('action') == 'update_exercise':
        # Actualizar ejercicio específico
        try:
            exercise_id = data.get('exercise_id')
            exercise = WorkoutExercise.objects.get(id=exercise_id)  # Cambiado a WorkoutExercise
            
            # Verificar que el ejercicio pertenezca al plan del cliente
            plan = WorkoutPlan.objects.filter(user=client).first()
            if not plan or not plan.workout_days.filter(workout_exercises=exercise).exists():  # Ajustado
                return Response({'error': 'Ejercicio no pertenece al cliente'}, status=403)
            
            # Actualizar campos
            if 'name' in data:
                exercise.name = data['name']
            if 'sets' in data:
                exercise.sets = data['sets']
            if 'reps' in data:
                exercise.reps = data['reps']
            if 'rest_time' in data:
                exercise.rest_seconds = data['rest_time']  # Cambiado a rest_seconds
            if 'notes' in data:
                exercise.notes = data['notes']
            
            exercise.save()
            
            return Response({
                'message': 'Ejercicio actualizado exitosamente',
                'exercise': {
                    'id': exercise.id,
                    'name': exercise.name,
                    'sets': exercise.sets,
                    'reps': exercise.reps,
                    'rest_time': exercise.rest_seconds,  # Cambiado
                    'notes': exercise.notes
                }
            })
            
        except WorkoutExercise.DoesNotExist:  # Cambiado
            return Response({'error': 'Ejercicio no encontrado'}, status=404)
    
    return Response({'message': 'Acción completada'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_trainers(request):
    """Obtener lista de entrenadores disponibles"""
    try:
        # Obtener entrenadores activos
        trainers = CustomUser.objects.filter(
            role='entrenador',
            is_active=True
        ).select_related('trainer_profile')
        
        # Usar el nuevo serializador
        serializer = AvailableTrainerSerializer(trainers, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error en available_trainers: {e}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_trainer(request):
    """Asignar un entrenador al usuario actual"""
    try:
        user = request.user
        
        # Validar datos
        serializer = AssignTrainerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        trainer_id = serializer.validated_data['trainer_id']
        
        # Obtener entrenador
        trainer = CustomUser.objects.get(id=trainer_id, role='entrenador')
        
        # Obtener o crear perfil del usuario
        user_profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Asignar entrenador
        user_profile.trainer = trainer
        user_profile.save()
        
        logger.info(f"Entrenador {trainer.email} asignado a {user.email}")
        
        # Devolver respuesta estructurada
        response_serializer = AssignedTrainerSerializer(user_profile)
        
        return Response({
            'success': True,
            'message': f'Entrenador {trainer.nombre or trainer.email} asignado exitosamente',
            'data': response_serializer.data
        })
        
    except CustomUser.DoesNotExist:
        return Response({'error': 'Entrenador no encontrado'}, status=404)
    except Exception as e:
        logger.error(f"Error en assign_trainer: {e}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_trainer(request):
    """Remover entrenador asignado"""
    try:
        user = request.user
        
        # Obtener perfil del usuario
        try:
            user_profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Perfil no encontrado'}, status=404)
        
        if not user_profile.trainer:
            return Response({'error': 'No tienes entrenador asignado'}, status=400)
        
        # Guardar info del entrenador antes de remover
        trainer_info = {
            'id': user_profile.trainer.id,
            'name': user_profile.trainer.nombre or user_profile.trainer.email
        }
        
        # Remover entrenador
        user_profile.trainer = None
        user_profile.save()
        
        return Response({
            'success': True,
            'message': 'Entrenador removido exitosamente',
            'removed_trainer': trainer_info
        })
        
    except Exception as e:
        logger.error(f"Error en remove_trainer: {e}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_trainer(request):
    """Obtener información del entrenador asignado"""
    try:
        user = request.user
        
        try:
            user_profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            return Response({'trainer': None})
        
        if not user_profile.trainer:
            return Response({'trainer': None})
        
        trainer = user_profile.trainer
        
        # Usar AvailableTrainerSerializer para datos consistentes
        serializer = AvailableTrainerSerializer(trainer)
        
        return Response({
            'trainer': serializer.data,
            'assigned_since': user_profile.trainer_assigned_date if hasattr(user_profile, 'trainer_assigned_date') else None
        })
        
    except Exception as e:
        logger.error(f"Error en my_trainer: {e}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_users_for_admin(request):
    """Listar todos los usuarios para administración"""
    user = request.user
    
    if not (user.is_superuser or user.is_staff):
        return Response({'error': 'No autorizado'}, status=403)
    
    users = CustomUser.objects.all().select_related('profile')
    
    data = []
    for user in users:
        try:
            profile = user.profile
            trainer_info = None
            if profile.trainer:
                trainer_info = {
                    'id': profile.trainer.id,
                    'name': profile.trainer.nombre or profile.trainer.email
                }
        except UserProfile.DoesNotExist:
            profile = None
            trainer_info = None
        
        data.append({
            'id': user.id,
            'email': user.email,
            'name': user.nombre or f"{user.first_name} {user.last_name}" or user.email.split('@')[0],
            'role': user.role,
            'trainer': trainer_info
        })
    
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_assign_trainer(request):
    """Vista de administración para asignar clientes a entrenadores"""
    user = request.user
    
    # Solo administradores o superusuarios
    if not (user.is_superuser or user.is_staff):
        return Response({'error': 'No autorizado'}, status=403)
    
    client_id = request.data.get('client_id')
    trainer_id = request.data.get('trainer_id')
    
    if not client_id or not trainer_id:
        return Response({'error': 'client_id y trainer_id requeridos'}, status=400)
    
    try:
        client = CustomUser.objects.get(id=client_id)
        trainer = CustomUser.objects.get(id=trainer_id, role='entrenador')
        
        # Obtener o crear perfil
        client_profile, created = UserProfile.objects.get_or_create(user=client)
        client_profile.trainer = trainer
        client_profile.save()
        
        return Response({
            'success': True,
            'message': f'Cliente {client.email} asignado a entrenador {trainer.email}',
            'client': {
                'id': client.id,
                'email': client.email,
                'name': client.nombre or client.email
            },
            'trainer': {
                'id': trainer.id,
                'email': trainer.email,
                'name': trainer.nombre or trainer.email
            }
        })
        
    except CustomUser.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=404)
    except Exception as e:
        logger.error(f"Error en admin_assign_trainer: {e}")
        return Response({'error': str(e)}, status=500)