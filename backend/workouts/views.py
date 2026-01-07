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

# =============================================================================
# CONFIGURACIÓN DE LA API DE GROQ - VERSIÓN CORREGIDA Y FUNCIONAL
# =============================================================================
GROQ_API_KEY = "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"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# MODELOS ACTUALES Y FUNCIONALES VERIFICADOS
GROQ_MODELS = [
    "llama-3.3-70b-versatile",          # Para generar rutinas (más potente) - VERIFICADO FUNCIONAL
    "llama-3.1-8b-instant",             # Para chat (rápido) - VERIFICADO FUNCIONAL
    "groq/compound-mini",               # Alternativa para chat
    "meta-llama/llama-4-maverick-17b-128e-instruct",  # Backup para rutinas
    "qwen/qwen3-32b"                    # Backup general
]

# =============================================================================
# FUNCIONES AUXILIARES MEJORADAS
# =============================================================================

def limpiar_texto_rutina(text_result):
    """Limpia el texto JSON devuelto por la IA - VERSIÓN ROBUSTA"""
    if not text_result:
        return ""
    
    text_result = text_result.strip()
    print(f"[DEBUG] Texto original recibido ({len(text_result)} caracteres)")
    
    # Si ya es JSON válido, retornarlo
    if text_result.startswith('{') and text_result.endswith('}'):
        return text_result
    
    # Extraer JSON de diferentes formatos
    json_patterns = [
        r'```json\s*(.*?)\s*```',      # ```json ... ```
        r'```\s*(.*?)\s*```',           # ``` ... ```
        r'\{\s*"title".*?"days".*?\}',  # JSON directo
    ]
    
    for pattern in json_patterns:
        match = re.search(pattern, text_result, re.DOTALL)
        if match:
            extracted = match.group(1) if '```' in pattern else match.group(0)
            print(f"[DEBUG] JSON extraído con patrón: {pattern[:20]}...")
            return extracted.strip()
    
    # Si no se encuentra JSON, buscar cualquier objeto JSON
    json_start = text_result.find('{')
    json_end = text_result.rfind('}')
    
    if json_start != -1 and json_end != -1 and json_end > json_start:
        extracted = text_result[json_start:json_end+1]
        print(f"[DEBUG] JSON extraído por posiciones")
        return extracted
    
    print("[DEBUG] No se pudo extraer JSON válido")
    return text_result

def extraer_json_seguro(texto):
    """Extrae JSON de forma segura con múltiples intentos"""
    if not texto:
        return None
    
    # Intentar diferentes métodos de extracción
    try:
        # Método 1: Parsear directamente
        return json.loads(texto)
    except json.JSONDecodeError:
        pass
    
    # Método 2: Buscar objeto JSON
    try:
        match = re.search(r'\{.*\}', texto, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except:
        pass
    
    # Método 3: Limpiar y reintentar
    texto_limpio = limpiar_texto_rutina(texto)
    try:
        return json.loads(texto_limpio)
    except:
        return None

def generar_rutina_temporal(user_profile):
    """Genera una rutina temporal si falla la IA - MEJORADA"""
    print(f"[RUTINA_TEMPORAL] Generando para {user_profile.user.nombre}")
    
    frecuencia = user_profile.frecuencia or 3
    experiencia = user_profile.experiencia.lower()
    objetivo = user_profile.objetivo.lower()
    
    # Adaptar según experiencia
    sets_base = 3
    reps_base = "8-12"
    
    if "principiante" in experiencia:
        sets_base = 2
        reps_base = "10-15"
        descanso = 90
    elif "intermedio" in experiencia:
        sets_base = 3
        reps_base = "8-12"
        descanso = 60
    else:  # avanzado
        sets_base = 4
        reps_base = "6-10"
        descanso = 45
    
    # Adaptar según objetivo
    if "perder" in objetivo or "quemar" in objetivo:
        reps_base = "12-15"
        descanso = 30
    elif "fuerza" in objetivo:
        reps_base = "4-8"
        descanso = 120
    
    ejercicios_por_objetivo = {
        "fuerza": [
            {"name": "Sentadillas con peso corporal", "sets": sets_base, "reps": reps_base, "rest_seconds": descanso, "notes": "Mantén la espalda recta"},
            {"name": "Flexiones", "sets": sets_base, "reps": reps_base, "rest_seconds": descanso, "notes": "Codos cerca del cuerpo"},
            {"name": "Dominadas asistidas", "sets": sets_base, "reps": "6-10", "rest_seconds": descanso, "notes": "Controla el movimiento"}
        ],
        "resistencia": [
            {"name": "Burpees", "sets": 3, "reps": "10-15", "rest_seconds": 45, "notes": "Movimiento fluido"},
            {"name": "Saltos de tijera", "sets": 3, "reps": "30-40", "rest_seconds": 30, "notes": "Ritmo constante"},
            {"name": "Mountain climbers", "sets": 3, "reps": "20-30 por lado", "rest_seconds": 40, "notes": "Core activado"}
        ],
        "default": [
            {"name": "Flexiones de pecho", "sets": sets_base, "reps": reps_base, "rest_seconds": descanso, "notes": "Espalda recta"},
            {"name": "Sentadillas", "sets": sets_base, "reps": reps_base, "rest_seconds": descanso, "notes": "Profundidad controlada"},
            {"name": "Plancha abdominal", "sets": 3, "reps": "30-60 segundos", "rest_seconds": 45, "notes": "Mantén posición alineada"}
        ]
    }
    
    # Seleccionar ejercicios según objetivo
    if "fuerza" in objetivo:
        ejercicios = ejercicios_por_objetivo["fuerza"]
    elif "resistencia" in objetivo or "cardio" in objetivo:
        ejercicios = ejercicios_por_objetivo["resistencia"]
    else:
        ejercicios = ejercicios_por_objetivo["default"]
    
    tipos_entrenamiento = [
        "Fuerza Superior", 
        "Fuerza Inferior", 
        "Full Body", 
        "Cardio y Core", 
        "HIIT"
    ]
    
    days = []
    for day_index in range(frecuencia):
        tipo_idx = day_index % len(tipos_entrenamiento)
        
        days.append({
            "name": f"Día {day_index + 1} - {tipos_entrenamiento[tipo_idx]}",
            "exercises": ejercicios.copy()  # Copia para no modificar el original
        })
    
    return {
        "title": f"Plan Personalizado - {user_profile.user.nombre}",
        "days": days,
        "frecuencia_usada": frecuencia
    }

# =============================================================================
# FUNCIONES DE IA - VERSIÓN ROBUSTA CON MANEJO DE ERRORES
# =============================================================================

def generar_rutina_con_groq(user_profile):
    """Genera rutina usando Groq API - VERSIÓN ROBUSTA"""
    try:
        print(f"[GROQ_RUTINA] Iniciando para {user_profile.user.nombre}")
        print(f"[GROQ_RUTINA] Frecuencia: {user_profile.frecuencia}, Objetivo: {user_profile.objetivo}")
        
        prompt = f"""
        PERFIL DEL USUARIO:
        - Nombre: {user_profile.user.nombre}
        - Objetivo principal: {user_profile.objetivo}
        - Nivel de experiencia: {user_profile.experiencia}
        - Frecuencia deseada: {user_profile.frecuencia} días/semana
        - Limitaciones/lesiones: {user_profile.lesiones or 'Ninguna'}
        - Condiciones especiales: {user_profile.discapacidad or 'No'}
        - Peso actual: {user_profile.peso} kg
        - Altura: {user_profile.altura} cm

        INSTRUCCIONES:
        1. Genera una rutina de {user_profile.frecuencia} días
        2. Adapta la intensidad al nivel: {user_profile.experiencia}
        3. Considera: {user_profile.lesiones or 'sin limitaciones'}
        4. Enfócate en: {user_profile.objetivo}
        5. Incluye ejercicios variados y seguros

        FORMATO DE RESPUESTA (SOLO JSON):
        {{
            "title": "Plan Personalizado para [Nombre] - [Objetivo]",
            "days": [
                {{
                    "name": "Día 1: [Descripción breve]",
                    "exercises": [
                        {{
                            "name": "Nombre del ejercicio en español",
                            "sets": número,
                            "reps": "rango como 8-12",
                            "rest_seconds": número,
                            "notes": "Instrucciones técnicas importantes"
                        }}
                    ]
                }}
            ]
        }}
        """
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Intentar con modelos en orden de preferencia
        modelos_a_probar = [
            GROQ_MODELS[0],  # llama-3.3-70b-versatile (principal)
            GROQ_MODELS[3],  # meta-llama/llama-4-maverick-17b-128e-instruct
            GROQ_MODELS[2],  # groq/compound-mini
        ]
        
        for modelo_idx, modelo in enumerate(modelos_a_probar):
            try:
                print(f"[GROQ_RUTINA] Intentando con modelo {modelo_idx+1}: {modelo}")
                
                payload = {
                    "model": modelo,
                    "messages": [
                        {
                            "role": "system",
                            "content": "Eres un entrenador personal experto. Genera rutinas en formato JSON estricto. Solo responde con JSON válido, sin texto adicional."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,  # Bajo para consistencia en JSON
                    "max_tokens": 1500,
                    "top_p": 0.8
                }
                
                response = requests.post(
                    GROQ_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=45
                )
                
                if response.status_code == 200:
                    data = response.json()
                    text_result = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    if not text_result:
                        print(f"[GROQ_RUTINA] Modelo {modelo}: Respuesta vacía")
                        continue
                    
                    print(f"[GROQ_RUTINA] Respuesta recibida ({len(text_result)} chars)")
                    
                    # Intentar extraer y validar JSON
                    rutina_json = extraer_json_seguro(text_result)
                    
                    if rutina_json and isinstance(rutina_json, dict):
                        # Validar estructura básica
                        if "title" in rutina_json and "days" in rutina_json:
                            dias_generados = len(rutina_json.get("days", []))
                            print(f"[GROQ_RUTINA] ✅ Éxito con modelo {modelo}: {dias_generados} días")
                            return rutina_json
                        else:
                            print(f"[GROQ_RUTINA] Modelo {modelo}: Estructura JSON incompleta")
                    else:
                        print(f"[GROQ_RUTINA] Modelo {modelo}: No se pudo extraer JSON válido")
                
                else:
                    print(f"[GROQ_RUTINA] Modelo {modelo} falló: {response.status_code}")
                    if response.status_code == 400:
                        error_data = response.json()
                        print(f"[GROQ_RUTINA] Error detallado: {error_data}")
            
            except requests.Timeout:
                print(f"[GROQ_RUTINA] Modelo {modelo}: Timeout")
                continue
            except Exception as e:
                print(f"[GROQ_RUTINA] Modelo {modelo}: Error {type(e).__name__}: {e}")
                continue
        
        print("[GROQ_RUTINA] ❌ Todos los modelos fallaron")
        return None
        
    except Exception as e:
        print(f"[GROQ_RUTINA] Error general: {type(e).__name__}: {e}")
        traceback.print_exc()
        return None

def generar_rutina_con_ia_mejorada(user_profile):
    """Versión mejorada con fallback inteligente"""
    print(f"[IA_MEJORADA] Procesando perfil de {user_profile.user.nombre}")
    
    # Primero intentar con Groq
    rutina = generar_rutina_con_groq(user_profile)
    
    if rutina:
        print(f"[IA_MEJORADA] ✅ Rutina generada con IA: {rutina.get('title', 'Sin título')}")
        return rutina
    
    # Si falla, usar rutina temporal mejorada
    print("[IA_MEJORADA] ⚠️ Usando rutina temporal de respaldo")
    return generar_rutina_temporal(user_profile)

# =============================================================================
# ENDPOINT DE CHAT ASISTENTE - VERSIÓN CORREGIDA Y ROBUSTA
# =============================================================================

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def chat_asistente(request):
    """Chat con asistente IA - VERSIÓN ROBUSTA Y FUNCIONAL"""
    pregunta = request.data.get("prompt", "").strip()
    if not pregunta:
        return Response({"error": "No se recibió pregunta"}, status=400)
    
    print(f"[CHAT] Pregunta recibida: {pregunta[:100]}...")
    
    try:
        # Obtener contexto del usuario
        user_context = "Usuario general"
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            user_context = f"""
            PERFIL:
            • Nombre: {user_profile.user.nombre}
            • Objetivo: {user_profile.objetivo}
            • Experiencia: {user_profile.experiencia}
            • Frecuencia: {user_profile.frecuencia} días/semana
            • Lesiones: {user_profile.lesiones or 'Ninguna'}
            • Peso: {user_profile.peso} kg
            • Altura: {user_profile.altura} cm
            """
        except UserProfile.DoesNotExist:
            print("[CHAT] Usuario sin perfil completo")
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Modelos a probar en orden
        modelos_chat = [
            GROQ_MODELS[1],  # llama-3.1-8b-instant (principal para chat)
            GROQ_MODELS[2],  # groq/compound-mini (alternativa)
            GROQ_MODELS[4],  # qwen/qwen3-32b (backup)
        ]
        
        respuesta_final = None
        modelo_usado = None
        
        for modelo in modelos_chat:
            try:
                print(f"[CHAT] Probando modelo: {modelo}")
                
                payload = {
                    "model": modelo,
                    "messages": [
                        {
                            "role": "system",
                            "content": f"""Eres AdaptaFit Coach, un entrenador personal virtual experto.

{user_context}

INSTRUCCIONES:
1. Responde SIEMPRE en español
2. Sé específico, práctico y motivacional
3. Adapta tus consejos al perfil del usuario
4. Si no sabes algo, admítelo amablemente
5. Mantén respuestas claras y concisas (máximo 300 palabras)

ÁREAS DE CONOCIMIENTO:
- Rutinas de ejercicio personalizadas
- Técnica correcta y segura
- Nutrición básica para fitness
- Recuperación y prevención de lesiones
- Motivación y seguimiento de progreso"""
                        },
                        {
                            "role": "user",
                            "content": pregunta
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 600,
                    "top_p": 0.9
                }
                
                response = requests.post(
                    GROQ_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=25
                )
                
                if response.status_code == 200:
                    data = response.json()
                    texto_respuesta = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    if texto_respuesta and len(texto_respuesta.strip()) > 10:
                        respuesta_final = texto_respuesta.strip()
                        modelo_usado = modelo
                        print(f"[CHAT] ✅ Éxito con modelo: {modelo}")
                        break
                    else:
                        print(f"[CHAT] Modelo {modelo}: Respuesta muy corta o vacía")
                
                else:
                    error_msg = response.text[:200] if response.text else "Sin detalles"
                    print(f"[CHAT] Modelo {modelo} falló ({response.status_code}): {error_msg}")
                    
                    # Si es error de modelo descontinuado, saltar al siguiente
                    if "model_decommissioned" in response.text:
                        print(f"[CHAT] Modelo {modelo} descontinuado, probando siguiente...")
                        continue
                    
            except requests.Timeout:
                print(f"[CHAT] Modelo {modelo}: Timeout")
                continue
            except Exception as e:
                print(f"[CHAT] Modelo {modelo}: Error {type(e).__name__}")
                continue
        
        if respuesta_final:
            print(f"[CHAT] Respuesta exitosa ({len(respuesta_final)} caracteres) con modelo: {modelo_usado}")
            return Response({"answer": respuesta_final})
        else:
            print("[CHAT] ❌ Todos los modelos fallaron")
            return Response({
                "answer": "Lo siento, no pude procesar tu pregunta en este momento. Por favor, intenta nuevamente o consulta nuestras guías de entrenamiento disponibles."
            })
    
    except Exception as e:
        print(f"[CHAT] ❌ Error general: {type(e).__name__}: {e}")
        traceback.print_exc()
        return Response({
            "answer": "Hubo un error técnico al procesar tu solicitud. Por favor, intenta nuevamente en unos momentos."
        })

# =============================================================================
# FUNCIÓN PRINCIPAL DE GENERACIÓN DE PLAN - VERSIÓN MEJORADA
# =============================================================================

def generar_y_guardar_plan(user):
    """Genera y guarda plan en BD - VERSIÓN ROBUSTA"""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    if not isinstance(user, User):
        print("[PLAN] ❌ 'user' no es instancia de User")
        return None

    try:
        profile = UserProfile.objects.get(user=user)
        print(f"[PLAN] ✅ Perfil encontrado para {user.nombre} (ID: {user.id})")
        print(f"[PLAN] Detalles: Frecuencia={profile.frecuencia}, Objetivo={profile.objetivo}")
    except UserProfile.DoesNotExist:
        print(f"[PLAN] ❌ No existe perfil para usuario {user.id}")
        return None

    # Validar campos obligatorios con mensajes claros
    campos_obligatorios = [
        ('fechaNacimiento', 'Fecha de nacimiento'),
        ('altura', 'Altura'),
        ('peso', 'Peso'),
        ('objetivo', 'Objetivo'),
        ('experiencia', 'Nivel de experiencia'),
        ('frecuencia', 'Frecuencia semanal')
    ]
    
    campos_faltantes = []
    for campo, nombre in campos_obligatorios:
        valor = getattr(profile, campo, None)
        if not valor:
            campos_faltantes.append(nombre)
        else:
            print(f"[PLAN]   {nombre}: {valor}")
    
    if campos_faltantes:
        print(f"[PLAN] ❌ Campos faltantes: {', '.join(campos_faltantes)}")
        return None

    print(f"[PLAN] 🚀 Generando rutina para {user.nombre}...")
    rutina_data = generar_rutina_con_ia_mejorada(profile)
    
    if not rutina_data:
        print(f"[PLAN] ❌ No se pudo generar rutina")
        return None

    try:
        # Crear plan
        plan = WorkoutPlan.objects.create(
            title=rutina_data.get("title", f"Plan Personalizado - {user.nombre}"),
            generated_at=timezone.now(),
            user=user
        )
        print(f"[PLAN] ✅ Plan creado (ID: {plan.id})")

        # Crear días y ejercicios
        for idx, day in enumerate(rutina_data.get("days", [])):
            day_obj = WorkoutDay.objects.create(
                plan=plan,
                name=day.get("name", f"Día {idx+1}"),
                day_index=idx
            )
            
            for ex_idx, ex in enumerate(day.get("exercises", [])):
                exercise_name = ex.get("name", f"Ejercicio {ex_idx+1}").strip()
                if not exercise_name:
                    exercise_name = f"Ejercicio {ex_idx+1}"
                
                exercise_obj, created = Exercise.objects.get_or_create(
                    name=exercise_name,
                    defaults={
                        'category': 'fuerza',
                        'equipment': 'ninguno',
                        'description': ex.get("notes", ""),
                        'difficulty': 3
                    }
                )
                
                WorkoutExercise.objects.create(
                    day=day_obj,
                    exercise=exercise_obj,
                    name=exercise_name,
                    sets=ex.get("sets", 3),
                    reps=ex.get("reps", "8-12"),
                    rest_seconds=ex.get("rest_seconds", 60),
                    notes=ex.get("notes", "")
                )
            
            print(f"[PLAN]   Día {idx+1}: {day.get('name')} - {len(day.get('exercises', []))} ejercicios")

        print(f"[PLAN] 🎉 Plan completo guardado exitosamente")
        return plan
        
    except Exception as e:
        print(f"[PLAN] ❌ Error al guardar plan: {type(e).__name__}: {e}")
        traceback.print_exc()
        
        # Intentar limpiar si hubo error parcial
        try:
            if 'plan' in locals():
                plan.delete()
                print("[PLAN] Plan eliminado por error")
        except:
            pass
        
        return None

# =============================================================================
# FUNCIONES AUXILIARES DE ESTADÍSTICAS
# =============================================================================

def calculate_current_streak(user):
    """Calcula racha actual de entrenamiento"""
    today = timezone.now().date()
    streak = 0
    
    for i in range(30):
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
# ENDPOINTS DE API - VERSIONES ESTABLES
# =============================================================================

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """Estadísticas del usuario"""
    try:
        user = request.user
        today = timezone.now().date()
        
        streak = calculate_current_streak(user)
        total_workouts = WorkoutPlan.objects.filter(user=user).count()
        
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
        
    except Exception as e:
        print(f"[STATS] Error: {e}")
        return Response({'error': 'Error al obtener estadísticas'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def today_workout(request):
    """Rutina de hoy"""
    try:
        user = request.user
        today = timezone.now().date()
        day_of_week = today.weekday()
        
        active_plan = WorkoutPlan.objects.filter(
            user=user
        ).latest('generated_at')
        
        today_workout_day = active_plan.workout_days.filter(day_index=day_of_week).first()
        
        if not today_workout_day:
            return Response({'error': 'No hay rutina programada para hoy'}, status=404)
        
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
        return Response({'error': 'No tienes un plan activo. Genera uno primero.'}, status=404)
    except Exception as e:
        print(f"[TODAY_WORKOUT] Error: {e}")
        return Response({'error': 'Error al obtener rutina de hoy'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def complete_exercise(request):
    """Marcar ejercicio como completado"""
    try:
        user = request.user
        workout_exercise_id = request.data.get('exercise_id')
        
        if not workout_exercise_id:
            return Response({'error': 'ID de ejercicio requerido'}, status=400)
        
        print(f"[COMPLETE] Marcando ejercicio ID: {workout_exercise_id}")
        
        workout_exercise = WorkoutExercise.objects.get(id=workout_exercise_id)
        
        # Obtener o crear ejercicio base
        if workout_exercise.exercise:
            exercise = workout_exercise.exercise
        else:
            exercise, created = Exercise.objects.get_or_create(
                name=workout_exercise.name,
                defaults={
                    'category': 'fuerza',
                    'equipment': 'ninguno',
                    'description': workout_exercise.notes or '',
                    'difficulty': 3
                }
            )
            workout_exercise.exercise = exercise
            workout_exercise.save()
        
        # Crear o actualizar progreso
        progress, created = UserProgress.objects.get_or_create(
            user=user,
            exercise=exercise,
            defaults={'completed': True, 'completed_at': timezone.now()}
        )
        
        if not created:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()
        
        print(f"[COMPLETE] ✅ Ejercicio '{exercise.name}' marcado como completado")
        return Response({'success': True})
        
    except WorkoutExercise.DoesNotExist:
        return Response({'error': 'Ejercicio no encontrado'}, status=404)
    except Exception as e:
        print(f"[COMPLETE] ❌ Error: {e}")
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def completed_exercises(request):
    """Ejercicios completados"""
    try:
        user = request.user
        
        completed_exercise_ids = UserProgress.objects.filter(
            user=user,
            completed=True
        ).values_list('exercise_id', flat=True)
        
        completed_workout_exercise_ids = WorkoutExercise.objects.filter(
            exercise_id__in=completed_exercise_ids
        ).values_list('id', flat=True)
        
        return Response({
            'completed_exercises': list(completed_workout_exercise_ids)
        })
        
    except Exception as e:
        print(f"[COMPLETED] Error: {e}")
        return Response({'error': 'Error al obtener ejercicios completados'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def complete_workout(request):
    """Marcar entrenamiento completo"""
    try:
        user = request.user
        workout_id = request.data.get('workout_id')
        
        if not workout_id:
            return Response({'error': 'ID de entrenamiento requerido'}, status=400)
        
        workout_day = WorkoutDay.objects.get(id=workout_id)
        exercises = workout_day.workout_exercises.all()
        
        completed_count = 0
        for workout_exercise in exercises:
            if workout_exercise.exercise:
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
        print(f"[COMPLETE_WORKOUT] Error: {e}")
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def plan_detail(request, plan_id):
    """Detalles de un plan"""
    try:
        plan = WorkoutPlan.objects.get(id=plan_id, user=request.user)
        serializer = WorkoutPlanSerializer(plan)
        return Response(serializer.data)
    except WorkoutPlan.DoesNotExist:
        return Response({'error': 'Plan no encontrado'}, status=404)
    except Exception as e:
        print(f"[PLAN_DETAIL] Error: {e}")
        return Response({'error': 'Error al obtener detalles del plan'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def plan_por_usuario(request, user_id):
    """Obtiene o genera plan para usuario"""
    try:
        print(f"[PLAN_USUARIO] Solicitando plan para usuario ID: {user_id}")
        
        # Verificar permisos
        if int(user_id) != request.user.id and not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=403)

        # Buscar plan existente
        plan = WorkoutPlan.objects.filter(user_id=user_id).order_by('-generated_at').first()

        if plan:
            print(f"[PLAN_USUARIO] ✅ Plan existente encontrado (ID: {plan.id})")
            serializer = WorkoutPlanSerializer(plan)
            return Response(serializer.data)

        print(f"[PLAN_USUARIO] 🚀 Generando nuevo plan...")
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if int(user_id) == request.user.id:
            user_obj = request.user
        else:
            user_obj = User.objects.get(id=user_id)

        plan = generar_y_guardar_plan(user_obj)
        if not plan:
            return Response({'error': 'No se pudo generar la rutina. Verifica que tu perfil esté completo.'}, status=400)

        serializer = WorkoutPlanSerializer(plan)
        return Response(serializer.data)

    except User.DoesNotExist:
        return Response({'error': f'Usuario con ID {user_id} no existe'}, status=404)
    except Exception as e:
        print(f"[PLAN_USUARIO] ❌ Error: {e}")
        return Response({'error': 'Error interno al procesar la solicitud'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def mis_planes(request):
    """Todos los planes del usuario"""
    try:
        planes = WorkoutPlan.objects.filter(user=request.user).order_by('-generated_at')
        serializer = WorkoutPlanSerializer(planes, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"[MIS_PLANES] Error: {e}")
        return Response({'error': 'Error al obtener planes'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def regenerar_plan(request, user_id):
    """Regenera plan"""
    try:
        # Verificar permisos
        if int(user_id) != request.user.id and not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=403)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if int(user_id) == request.user.id:
            user_obj = request.user
        else:
            user_obj = User.objects.get(id=user_id)

        plan = generar_y_guardar_plan(user_obj)
        if not plan:
            return Response({'error': 'No se pudo regenerar la rutina'}, status=400)

        serializer = WorkoutPlanSerializer(plan)
        return Response({
            'message': 'Plan regenerado exitosamente',
            'plan': serializer.data
        })

    except User.DoesNotExist:
        return Response({'error': f'Usuario con ID {user_id} no existe'}, status=404)
    except Exception as e:
        print(f"[REGENERAR_PLAN] Error: {e}")
        return Response({'error': 'Error interno al regenerar el plan'}, status=500)


# workouts/views.py - Añade estas funciones

def es_entrenador_o_superusuario(user):
    """Verifica si el usuario es entrenador o superusuario"""
    # Verifica primero el rol personalizado, luego si es superusuario
    try:
        # Si tu modelo User tiene un campo 'role'
        if hasattr(user, 'role'):
            return user.role == 'entrenador' or user.is_superuser
        # Si no, verifica si está en un grupo 'entrenadores'
        elif user.groups.filter(name='entrenadores').exists():
            return True
        else:
            return user.is_superuser
    except AttributeError:
        return user.is_superuser

@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def actualizar_ejercicio(request, exercise_id):
    """Actualizar ejercicio - SOLO para entrenadores"""
    try:
        user = request.user
        print(f"[ACTUALIZAR_EJERCICIO] Usuario: {user.username}, Rol: {getattr(user, 'role', 'no definido')}")
        
        # Verificar que sea entrenador
        if not es_entrenador_o_superusuario(user):
            print(f"[ACTUALIZAR_EJERCICIO] Usuario no autorizado: {user.username}")
            return Response({'error': 'Solo los entrenadores pueden editar ejercicios'}, status=403)
        
        # Obtener el ejercicio del workout (WorkoutExercise)
        workout_exercise = WorkoutExercise.objects.get(id=exercise_id)
        
        # Validar datos recibidos
        data = request.data
        print(f"[ACTUALIZAR_EJERCICIO] Datos recibidos: {data}")
        
        # Campos que se pueden actualizar
        campos_permitidos = ['name', 'sets', 'reps', 'rest_seconds', 'notes']
        cambios_realizados = []
        
        for campo in campos_permitidos:
            if campo in data:
                valor_anterior = getattr(workout_exercise, campo)
                setattr(workout_exercise, campo, data[campo])
                cambios_realizados.append({
                    'campo': campo,
                    'anterior': valor_anterior,
                    'nuevo': data[campo]
                })
        
        # Guardar cambios
        workout_exercise.save()
        
        print(f"[ACTUALIZAR_EJERCICIO] ✅ Ejercicio {exercise_id} actualizado. Cambios: {cambios_realizados}")
        
        # Actualizar también el ejercicio base si es necesario
        if workout_exercise.exercise and 'name' in data:
            workout_exercise.exercise.name = data['name']
            workout_exercise.exercise.save()
        
        return Response({
            'success': True,
            'message': 'Ejercicio actualizado correctamente',
            'exercise': {
                'id': workout_exercise.id,
                'name': workout_exercise.name,
                'sets': workout_exercise.sets,
                'reps': workout_exercise.reps,
                'rest_seconds': workout_exercise.rest_seconds,
                'notes': workout_exercise.notes,
                'updated_by': user.username,
                'updated_at': timezone.now().isoformat()
            }
        })
        
    except WorkoutExercise.DoesNotExist:
        print(f"[ACTUALIZAR_EJERCICIO] ❌ Ejercicio {exercise_id} no encontrado")
        return Response({'error': 'Ejercicio no encontrado'}, status=404)
    except Exception as e:
        print(f"[ACTUALIZAR_EJERCICIO] ❌ Error: {type(e).__name__}: {e}")
        traceback.print_exc()
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_role(request):
    """Obtener rol del usuario actual"""
    try:
        user = request.user
        es_entrenador = es_entrenador_o_superusuario(user)
        
        return Response({
            'role': getattr(user, 'role', 'usuario'),
            'is_trainer': es_entrenador,
            'is_superuser': user.is_superuser,
            'username': user.username,
            'email': user.email
        })
    except Exception as e:
        print(f"[USER_ROLE] Error: {e}")
        return Response({
            'role': 'usuario',
            'is_trainer': False,
            'is_superuser': False
        }, status=200)