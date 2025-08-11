import requests
import json
import re
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from .serializers import WorkoutPlanSerializer
from .models import WorkoutPlan
from users.models import UserProfile
from django.forms.models import model_to_dict
from django.contrib.auth.decorators import login_required


# Configuración de la API de Gemini
GEMINI_API_KEY = "AIzaSyCR-3f8yFBdpCDG7XCk1-9deAOblEHNIOY"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def chat_asistente(request):
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


def limpiar_texto_rutina(text_result):
    text_result = text_result.strip()

    # Eliminar bloques markdown ```json ... ```
    if text_result.startswith("```json"):
        text_result = text_result[len("```json"):].strip()
    if text_result.endswith("```"):
        text_result = text_result[:-3].strip()

    # Reemplazar comillas triples con dobles
    text_result = text_result.replace('"""', '"')

    # Arreglar específicamente las repeticiones mal formateadas
    # Reemplazar patrones como: ""reps"":""8-12",  por  "reps":"8-12",
    text_result = re.sub(r'""reps"":""([^"]+)"', r'"reps":"\1"', text_result)

    # También, para otros casos raros, reemplazar dobles comillas dobles consecutivas en keys:
    text_result = re.sub(r'""(\w+)"":', r'"\1":', text_result)

    return text_result


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

    Devuelve la respuesta en JSON con este formato:
    {{
        "title": "Nombre del plan",
        "days": [
            {{
                "name": "Día X",
                "exercises": [
                    {{
                        "name": "Ejercicio",
                        "sets": 3,
                        "reps": "12",
                        "rest_seconds": 60,
                        "notes": "Notas opcionales"
                    }}
                ]
            }}
        ]
    }}

    IMPORTANTE: No uses comillas triples ni incluyas comentarios en el JSON.
    IMPORTANTE: Todos los valores de "reps" deben estar siempre entre comillas dobles, incluso si son números o textos con espacios.
    Ejemplo correcto: "reps": "10 por pierna". No usar valores numéricos sin comillas.
    """

    try:
        response = requests.post(
            GEMINI_URL,
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            }
        )
        data = response.json()
        
        text_result = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Limpiar y arreglar el texto JSON antes de parsear
        text_result = limpiar_texto_rutina(text_result)
        rutina = json.loads(text_result)
        return rutina
    
    except requests.RequestException as e:
        print(f"Error en la solicitud a Gemini: {e}")
        return None
    except KeyError as e:
        print(f"Error al procesar la respuesta de Gemini (KeyError): {e}")
        return None
    except json.JSONDecodeError as e:
        print("Error de JSON al parsear rutina:", e)
        print("Texto recibido:", text_result)
        return None


def generar_y_guardar_plan(user):
    """
    Genera un plan de ejercicios para un usuario y lo guarda en la BD.
    """
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return None

    rutina_data = generar_rutina_con_gemini(profile)
    if not rutina_data:
        return None

    plan = WorkoutPlan.objects.create(
        title=rutina_data.get("title", "Plan de entrenamiento"),
        generated_at=timezone.now(),
        user=user
    )
    for idx, day in enumerate(rutina_data.get("days", [])):
        day_obj = plan.days.create(name=day.get("name", f"Día {idx+1}"), day_index=idx)
        for ex in day.get("exercises", []):
            day_obj.exercises.create(
                name=ex.get("name", "Ejercicio sin nombre"),
                sets=ex.get("sets", 0),
                reps=ex.get("reps", ""),
                rest_seconds=ex.get("rest_seconds", 0),
                notes=ex.get("notes", "")
            )
    return plan


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def plan_detail(request, plan_id):
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
    if int(user_id) != request.user.id:
        return Response({'error': 'No autorizado'}, status=403)

    plan = WorkoutPlan.objects.filter(user_id=user_id).order_by('-generated_at').first()

    if not plan:
        plan = generar_y_guardar_plan(request.user)
        if not plan:
            return Response({'error': 'No se pudo generar la rutina'}, status=500)

    serializer = WorkoutPlanSerializer(plan)
    return Response(serializer.data)