# workouts/views.py
import requests
import json
import re
import traceback
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from .serializers import WorkoutPlanSerializer
from .models import WorkoutPlan, WorkoutDay, Exercise, UserProgress, WorkoutExercise
from users.models import UserProfile
from django.forms.models import model_to_dict
from django.contrib.auth.decorators import login_required


# Configuración de la API de Gemini
GEMINI_API_KEY = "AIzaSyCR-3f8yFBdpCDG7XCk1-9deAOblEHNIOY"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

def limpiar_texto_rutina(text_result):
    if not text_result:
        return ""
        
    text_result = text_result.strip()
    print(f"[DEBUG] Texto original: {text_result[:200]}...")

    # Eliminar bloques markdown ```json ... ```
    if "```json" in text_result:
        text_result = text_result.split("```json")[1].split("```")[0].strip()
    elif "```" in text_result:
        text_result = text_result.split("```")[1].split("```")[0].strip()

    # Eliminar posibles prefijos/sufijos de texto
    lines = text_result.split('\n')
    json_lines = []
    in_json = False
    
    for line in lines:
        line = line.strip()
        if line.startswith('{') or in_json:
            in_json = True
            json_lines.append(line)
        if line.endswith('}'):
            break
            
    if json_lines:
        text_result = '\n'.join(json_lines)

    # Arreglar problemas comunes de formato
    text_result = re.sub(r',\s*}', '}', text_result)  # Eliminar comas antes de }
    text_result = re.sub(r',\s*]', ']', text_result)  # Eliminar comas antes de ]
    
    # Arreglar comillas mal formadas
    text_result = re.sub(r'""([^"]+)""', r'"\1"', text_result)  # ""texto"" -> "texto"
    text_result = re.sub(r'"\s*\+\s*"', '', text_result)  # Unir strings concatenados
    
    # Asegurar que "reps" siempre tenga comillas
    text_result = re.sub(r'"reps"\s*:\s*(\d+)', r'"reps": "\1"', text_result)
    text_result = re.sub(r'"reps"\s*:\s*(\d+\s*-\s*\d+)', r'"reps": "\1"', text_result)

    print(f"[DEBUG] Texto limpiado: {text_result[:200]}...")
    return text_result

def generar_rutina_temporal(user_profile):
    """
    Función temporal para generar una rutina de prueba mientras se soluciona Gemini
    """
    print(f"[INFO] Usando rutina temporal para usuario {user_profile.user.id}")
    print(f"[DEBUG] Frecuencia del usuario: {user_profile.frecuencia} días")
    
    # Obtener la frecuencia REAL del perfil
    frecuencia = user_profile.frecuencia or 3  # Fallback a 3 si es None
    
    # Definir diferentes tipos de entrenamiento según el día
    tipos_entrenamiento = [
        "Fuerza Superior",
        "Fuerza Inferior", 
        "Full Body",
        "Cardio y Core",
        "HIIT",
        "Recuperación Activa",
        "Flexibilidad"
    ]
    
    ejercicios_base = [
        # Día 1 - Fuerza Superior
        [
            {
                "name": "Flexiones de pecho",
                "sets": 3,
                "reps": "10-15",
                "rest_seconds": 60,
                "notes": "Mantener espalda recta"
            },
            {
                "name": "Fondos de tríceps",
                "sets": 3,
                "reps": "8-12",
                "rest_seconds": 60,
                "notes": "Codos pegados al cuerpo"
            },
            {
                "name": "Plancha abdominal",
                "sets": 3,
                "reps": "30-45 segundos",
                "rest_seconds": 45,
                "notes": "Mantener posición alineada"
            }
        ],
        # Día 2 - Fuerza Inferior
        [
            {
                "name": "Sentadillas",
                "sets": 3,
                "reps": "12-15",
                "rest_seconds": 60,
                "notes": "Profundidad controlada"
            },
            {
                "name": "Elevaciones de cadera",
                "sets": 3,
                "reps": "15-20",
                "rest_seconds": 45,
                "notes": "Contraer glúteos"
            },
            {
                "name": "Zancadas",
                "sets": 3,
                "reps": "10-12 por pierna",
                "rest_seconds": 60,
                "notes": "Mantener equilibrio"
            }
        ],
        # Día 3 - Full Body
        [
            {
                "name": "Burpees",
                "sets": 3,
                "reps": "8-10",
                "rest_seconds": 60,
                "notes": "Movimiento fluido"
            },
            {
                "name": "Plancha lateral",
                "sets": 3,
                "reps": "20-30 segundos por lado",
                "rest_seconds": 30,
                "notes": "Mantener cadera elevada"
            },
            {
                "name": "Saltos de tijera",
                "sets": 3,
                "reps": "30-40",
                "rest_seconds": 45,
                "notes": "Ritmo constante"
            }
        ]
    ]
    
    # Generar días según la frecuencia real del usuario
    days = []
    for day_index in range(frecuencia):
        tipo_idx = day_index % len(tipos_entrenamiento)
        ejercicios_idx = day_index % len(ejercicios_base)
        
        days.append({
            "name": f"Día {day_index + 1} - {tipos_entrenamiento[tipo_idx]}",
            "exercises": ejercicios_base[ejercicios_idx]
        })
    
    return {
        "title": f"Plan Personalizado - {user_profile.user.nombre}",
        "days": days,
        "frecuencia_usada": frecuencia
    }

def generar_rutina_con_gemini(user_profile):
    """
    Genera una rutina de ejercicios a través de la API de Gemini.
    """
    prompt = f"""
    Eres un entrenador personal virtual.
    Genera una rutina semanal para este usuario:

    Nombre: {user_profile.user.nombre}
    Edad: {(timezone.now().date() - user_profile.fechaNacimiento).days // 365 if user_profile.fechaNacimiento else "N/A"}
    Altura: {user_profile.altura} cm
    Peso: {user_profile.peso} kg
    Objetivo: {user_profile.objetivo}
    Experiencia: {user_profile.experiencia}
    Frecuencia semanal: {user_profile.frecuencia} días
    Lesiones: {user_profile.lesiones or "Ninguna"}

    Devuelve SOLO un JSON válido con este formato exacto:
    {{
        "title": "Nombre del plan personalizado",
        "days": [
            {{
                "name": "Día 1 - Tipo de entrenamiento",
                "exercises": [
                    {{
                        "name": "Nombre del ejercicio",
                        "sets": 3,
                        "reps": "8-12",
                        "rest_seconds": 60,
                        "notes": "Instrucciones específicas"
                    }}
                ]
            }}
        ]
    }}

    IMPORTANTE: 
    - Responde ÚNICAMENTE con el JSON, sin texto adicional
    - Usa siempre comillas dobles para las cadenas
    - Asegúrate de que el JSON sea válido
    - Adapta la rutina al perfil específico del usuario
    - Incluye exactamente {user_profile.frecuencia} días de entrenamiento
    """

    try:
        print(f"[DEBUG] Enviando prompt a Gemini para usuario {user_profile.user.id}")
        
        response = requests.post(
            GEMINI_URL,
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            },
            timeout=30
        )
        
        print(f"[DEBUG] Status code de Gemini: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[ERROR] Gemini respondió con status: {response.status_code}")
            return None
            
        data = response.json()
        
        # MANEJO ROBUSTO DE DIFERENTES ESTRUCTURAS DE RESPUESTA
        text_result = None
        
        if "candidates" in data and data["candidates"]:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                text_result = candidate["content"]["parts"][0].get("text", "")
        
        elif "contents" in data and data["contents"]:
            content = data["contents"][0]
            if "parts" in content and content["parts"]:
                text_result = content["parts"][0].get("text", "")
        
        elif "text" in data:
            text_result = data["text"]
        
        if not text_result:
            print("[ERROR] No se pudo extraer texto de la respuesta de Gemini")
            return None
            
        print(f"[DEBUG] Texto crudo de Gemini: {text_result}")
        
        # Limpiar y arreglar el texto JSON antes de parsear
        text_result = limpiar_texto_rutina(text_result)
        
        # Validar que el texto contenga JSON
        if not text_result.strip().startswith('{'):
            print("[ERROR] La respuesta no contiene JSON válido")
            return None
            
        rutina = json.loads(text_result)
        
        # Validar estructura básica del JSON
        if "title" not in rutina or "days" not in rutina:
            print("[ERROR] JSON no tiene la estructura esperada")
            return None
            
        print(f"[SUCCESS] Rutina generada exitosamente para usuario {user_profile.user.id}")
        return rutina
    
    except Exception as e:
        print(f"[ERROR] Error en generar_rutina_con_gemini: {e}")
        return None

def generar_rutina_con_gemini_mejorada(user_profile):
    """
    Versión mejorada que intenta con Gemini primero y usa temporal si falla
    """
    rutina = generar_rutina_con_gemini(user_profile)
    if rutina:
        return rutina
    
    print(f"[WARN] Gemini falló, usando rutina temporal para usuario {user_profile.user.id}")
    return generar_rutina_temporal(user_profile)

def generar_y_guardar_plan(user):
    """
    Genera un plan de ejercicios para un usuario y lo guarda en la BD.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    if not isinstance(user, User):
        print("[ERROR] El argumento 'user' no es una instancia de User.")
        return None

    try:
        profile = UserProfile.objects.get(user=user)
        print(f"[DEBUG] Perfil encontrado para usuario {user.id}")
        print(f"[DEBUG] Frecuencia del perfil: {profile.frecuencia}")
    except UserProfile.DoesNotExist:
        print(f"[ERROR] No existe perfil para el usuario {user.id}")
        return None

    # Validar que el perfil tenga datos esenciales
    campos_obligatorios = ['fechaNacimiento', 'altura', 'peso', 'objetivo', 'experiencia', 'frecuencia']
    campos_faltantes = []
    
    for campo in campos_obligatorios:
        valor = getattr(profile, campo, None)
        if not valor:
            campos_faltantes.append(campo)
        else:
            print(f"[DEBUG] Campo {campo}: {valor}")
    
    if campos_faltantes:
        print(f"[ERROR] Campos faltantes en perfil {user.id}: {campos_faltantes}")
        return None

    print(f"[DEBUG] Generando rutina para usuario {user.id} con frecuencia {profile.frecuencia}...")
    rutina_data = generar_rutina_con_gemini_mejorada(profile)
    
    if not rutina_data:
        print(f"[ERROR] No se pudo generar rutina para el usuario {user.id}")
        return None

    try:
        plan = WorkoutPlan.objects.create(
            title=rutina_data.get("title", "Plan de entrenamiento"),
            generated_at=timezone.now(),
            user=user
        )

        # Crear días y ejercicios - CORREGIDO para usar WorkoutDay y WorkoutExercise
        for idx, day in enumerate(rutina_data.get("days", [])):
            day_obj = WorkoutDay.objects.create(
                plan=plan,
                name=day.get("name", f"Día {idx+1}"), 
                day_index=idx
            )
            
            for ex_idx, ex in enumerate(day.get("exercises", [])):
                # Buscar o crear el ejercicio en la base de datos Exercise
                exercise_obj, created = Exercise.objects.get_or_create(
                    name=ex.get("name", f"Ejercicio {ex_idx+1}"),
                    defaults={
                        'category': 'fuerza',
                        'equipment': 'ninguno',
                        'description': ex.get("notes", ""),
                        'difficulty': 3
                    }
                )
                
                # Crear el WorkoutExercise que relaciona el ejercicio con el día
                WorkoutExercise.objects.create(
                    day=day_obj,
                    exercise=exercise_obj,
                    name=ex.get("name", f"Ejercicio {ex_idx+1}"),
                    sets=ex.get("sets", 3),
                    reps=ex.get("reps", "8-12"),
                    rest_seconds=ex.get("rest_seconds", 60),
                    notes=ex.get("notes", "")
                )

        print(f"[SUCCESS] Plan generado y guardado para usuario {user.id} - ID: {plan.id}")
        return plan
        
    except Exception as e:
        print(f"[ERROR] Error al guardar plan en BD: {e}")
        return None

def calculate_current_streak(user):
    """Calcular la racha actual del usuario"""
    today = timezone.now().date()
    streak = 0
    
    # Verificar días consecutivos hacia atrás
    for i in range(30):  # Revisar hasta 30 días
        check_date = today - timedelta(days=i)
        has_workout = UserProgress.objects.filter(
            user=user,
            completed=True,
            completed_at__date=check_date
        ).exists()
        
        if has_workout:
            streak += 1
        else:
            break
    
    return streak

# =============================================================================
# ENDPOINTS DE API - CORREGIDOS
# =============================================================================

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def chat_asistente(request):
    """Endpoint para el chat con el asistente IA"""
    pregunta = request.data.get("prompt", "").strip()
    if not pregunta:
        return Response({"error": "No se recibió pregunta"}, status=400)

    try:
        response = requests.post(
            GEMINI_URL,
            json={
                "contents": [{"parts": [{"text": pregunta}]}]
            }
        )
        data = response.json()

        texto_respuesta = (
            data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
        )

        if not texto_respuesta:
            return Response({"error": "No se obtuvo respuesta"}, status=500)

        return Response({"answer": texto_respuesta})

    except requests.RequestException as e:
        print(f"Error en Gemini: {e}")
        return Response({"error": "Error al conectar con Gemini"}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """Obtener estadísticas del usuario - CORREGIDO"""
    user = request.user
    today = timezone.now().date()
    
    # Calcular racha actual
    streak = calculate_current_streak(user)
    
    # Estadísticas generales - CORREGIDAS
    total_workouts = WorkoutPlan.objects.filter(user=user).count()
    
    # Para completed_workouts, contar días únicos con ejercicios completados
    completed_workouts = UserProgress.objects.filter(
        user=user, 
        completed=True
    ).values('exercise__workoutexercise__day').distinct().count()
    
    total_exercises = WorkoutExercise.objects.filter(
        day__plan__user=user
    ).count()
    
    completed_exercises = UserProgress.objects.filter(
        user=user, 
        completed=True
    ).count()
    
    # Progreso semanal
    week_start = today - timedelta(days=today.weekday())
    weekly_progress = []
    
    for i in range(7):
        day_date = week_start + timedelta(days=i)
        day_completed = UserProgress.objects.filter(
            user=user,
            completed=True,
            completed_at__date=day_date
        ).exists()
        weekly_progress.append({
            'day': ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
            'progress': 100 if day_completed else 0
        })
    
    return Response({
        'total_workouts': total_workouts,
        'completed_workouts': completed_workouts,
        'total_exercises': total_exercises,
        'completed_exercises': completed_exercises,
        'current_streak': streak,
        'total_points': completed_exercises * 10 + completed_workouts * 50,
        'weekly_progress': weekly_progress
    })

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def today_workout(request):
    """Obtener la rutina de hoy - CORREGIDO"""
    user = request.user
    today = timezone.now().date()
    day_of_week = today.weekday()  # 0=Lunes, 6=Domingo
    
    try:
        # ✅ CORREGIDO: Eliminar is_active ya que no existe
        active_plan = WorkoutPlan.objects.filter(
            user=user
        ).latest('generated_at')
        
        # Buscar el día correspondiente a hoy
        today_workout_day = active_plan.workout_days.filter(day_index=day_of_week).first()
        
        if not today_workout_day:
            return Response({'error': 'No hay rutina para hoy'}, status=404)
        
        exercises = today_workout_day.workout_exercises.all()
        completed_exercises = UserProgress.objects.filter(
            user=user,
            exercise__in=exercises.values_list('exercise', flat=True),
            completed=True
        ).count()
        
        return Response({
            'id': today_workout_day.id,
            'name': today_workout_day.name,
            'exercises': [
                {
                    'id': ex.id,
                    'name': ex.name,
                    'sets': ex.sets,
                    'reps': ex.reps,
                    'completed': UserProgress.objects.filter(
                        user=user, 
                        exercise=ex.exercise,
                        completed=True
                    ).exists() if ex.exercise else False
                }
                for ex in exercises
            ],
            'total_exercises': exercises.count(),
            'completed_exercises': completed_exercises
        })
        
    except WorkoutPlan.DoesNotExist:
        return Response({'error': 'No tienes un plan activo'}, status=404)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def complete_exercise(request):
    """Marcar ejercicio como completado - VERSIÓN CORREGIDA PARA WorkoutExercise"""
    user = request.user
    workout_exercise_id = request.data.get('exercise_id')  # En realidad es workout_exercise_id
    
    print(f"🔍 Recibido workout_exercise_id: {workout_exercise_id}")
    
    try:
        # Buscar directamente en WorkoutExercise
        workout_exercise = WorkoutExercise.objects.get(id=workout_exercise_id)
        print(f"✅ WorkoutExercise encontrado: {workout_exercise.name}")
        
        # Si tiene exercise asociado, usar ese, sino crear uno nuevo
        if workout_exercise.exercise:
            exercise = workout_exercise.exercise
        else:
            # Crear un Exercise si no existe
            exercise, created = Exercise.objects.get_or_create(
                name=workout_exercise.name,
                defaults={
                    'category': 'fuerza',
                    'equipment': 'ninguno',
                    'description': workout_exercise.notes or '',
                    'difficulty': 3
                }
            )
            # Asociar el Exercise al WorkoutExercise
            workout_exercise.exercise = exercise
            workout_exercise.save()
        
        print(f"✅ Ejercicio a marcar: {exercise.name}")
        
        # Crear o actualizar el progreso
        progress, created = UserProgress.objects.get_or_create(
            user=user,
            exercise=exercise,
            defaults={'completed': True, 'completed_at': timezone.now()}
        )
        
        if not created:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()
        
        print("✅ Progreso guardado exitosamente")
        return Response({'success': True})
        
    except WorkoutExercise.DoesNotExist:
        print(f"❌ WorkoutExercise con ID {workout_exercise_id} no encontrado")
        return Response({'error': 'Ejercicio no encontrado'}, status=404)
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        print(f"📋 Traceback completo: {traceback.format_exc()}")
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def completed_exercises(request):
    """Obtener ejercicios completados del usuario - CORREGIDO"""
    user = request.user
    
    try:
        # Obtener IDs de ejercicios completados
        completed_exercise_ids = UserProgress.objects.filter(
            user=user,
            completed=True
        ).values_list('exercise_id', flat=True)
        
        # Obtener IDs de WorkoutExercise que corresponden a esos ejercicios
        completed_workout_exercise_ids = WorkoutExercise.objects.filter(
            exercise_id__in=completed_exercise_ids
        ).values_list('id', flat=True)
        
        return Response({
            'completed_exercises': list(completed_workout_exercise_ids)
        })
        
    except Exception as e:
        print(f"❌ Error en completed_exercises: {e}")
        return Response({'error': 'Error al obtener ejercicios completados'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def complete_workout(request):
    """Marcar entrenamiento completo como completado - CORREGIDO"""
    user = request.user
    workout_id = request.data.get('workout_id')
    
    try:
        # CORREGIDO: usar WorkoutDay en lugar de Day
        workout_day = WorkoutDay.objects.get(id=workout_id)
        # CORREGIDO: usar workout_exercises en lugar de exercises
        exercises = workout_day.workout_exercises.all()
        
        completed_count = 0
        for workout_exercise in exercises:
            if workout_exercise.exercise:  # Solo si tiene ejercicio asociado
                progress, created = UserProgress.objects.get_or_create(
                    user=user,
                    exercise=workout_exercise.exercise,
                    defaults={'completed': True, 'completed_at': timezone.now()}
                )
                if not created and not progress.completed:
                    progress.completed = True
                    progress.completed_at = timezone.now()
                    progress.save()
                completed_count += 1
        
        return Response({
            'success': True,
            'message': f'Se completaron {completed_count} ejercicios'
        })
        
    except WorkoutDay.DoesNotExist:
        return Response({'error': 'Entrenamiento no encontrado'}, status=404)
    except Exception as e:
        print(f"❌ Error en complete_workout: {e}")
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def plan_detail(request, plan_id):
    """Obtiene los detalles de un plan específico"""
    try:
        plan = WorkoutPlan.objects.get(id=plan_id, user=request.user)
    except WorkoutPlan.DoesNotExist:
        return Response({'error': 'Plan no encontrado'}, status=404)

    serializer = WorkoutPlanSerializer(plan)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def plan_por_usuario(request, user_id):
    """Obtiene o genera un plan de entrenamiento para un usuario específico"""
    try:
        print(f"[INFO] Solicitando plan para usuario {user_id}")
        
        # Permitir solo al dueño de la cuenta o a superusuarios
        if int(user_id) != request.user.id and not request.user.is_superuser:
            print(f"[WARN] Intento de acceso no autorizado al usuario {user_id}")
            return Response({'error': 'No autorizado'}, status=403)

        # Buscar plan más reciente
        plan = WorkoutPlan.objects.filter(user_id=user_id).order_by('-generated_at').first()

        if plan:
            print(f"[INFO] Plan existente encontrado para usuario {user_id}")
            serializer = WorkoutPlanSerializer(plan)
            return Response(serializer.data)

        print(f"[INFO] No hay plan previo para usuario {user_id}, generando uno nuevo...")
        
        # Obtener el usuario objetivo
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if int(user_id) == request.user.id:
            user_obj = request.user
        else:
            # Si es superusuario, buscar el usuario correspondiente
            try:
                user_obj = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': f'Usuario con ID {user_id} no existe'}, status=404)

        # Generar plan
        plan = generar_y_guardar_plan(user_obj)
        if not plan:
            error_msg = f'No se pudo generar la rutina para usuario {user_id}. Verifique que tenga perfil y datos completos.'
            print(f"[ERROR] {error_msg}")
            return Response({'error': error_msg}, status=400)

        serializer = WorkoutPlanSerializer(plan)
        return Response(serializer.data)

    except Exception as e:
        print(f"[ERROR] Error en plan_por_usuario para usuario {user_id}: {e}")
        return Response({'error': 'Error interno al procesar la solicitud'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def mis_planes(request):
    """Obtiene todos los planes del usuario autenticado"""
    try:
        planes = WorkoutPlan.objects.filter(user=request.user).order_by('-generated_at')
        serializer = WorkoutPlanSerializer(planes, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"[ERROR] Error obteniendo planes para usuario {request.user.id}: {e}")
        return Response({'error': 'Error al obtener los planes'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def regenerar_plan(request, user_id):
    """Regenera un plan de entrenamiento para un usuario"""
    try:
        # Verificar permisos
        if int(user_id) != request.user.id and not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=403)

        # Obtener el usuario
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if int(user_id) == request.user.id:
            user_obj = request.user
        else:
            try:
                user_obj = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': f'Usuario con ID {user_id} no existe'}, status=404)

        # Generar nuevo plan
        plan = generar_y_guardar_plan(user_obj)
        if not plan:
            return Response({'error': f'No se pudo regenerar la rutina para usuario {user_id}'}, status=400)

        serializer = WorkoutPlanSerializer(plan)
        return Response({
            'message': 'Plan regenerado exitosamente',
            'plan': serializer.data
        })

    except Exception as e:
        print(f"[ERROR] Error regenerando plan para usuario {user_id}: {e}")
        return Response({'error': 'Error interno al regenerar el plan'}, status=500)