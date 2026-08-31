"""
Motor de IA para AdaptaFit.
Capa opcional que enriquece los ejercicios generados con:
  - Notas técnicas personalizadas (según lesiones/objetivo del usuario)
  - URL de video ilustrativo (YouTube)

IMPORTANTE: Esta capa es OPTATIVA. Si no hay GEMINI_API_KEY configurada,
o si la API falla, todos los métodos regresan None y la app sigue
funcionando con el motor determinista original. Nunca rompe el flujo.
"""

import os
import json
import re

from django.conf import settings

# El SDK se importa de forma segura; si no está instalado, desactivamos la capa.
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash')

_model = None


def _get_model():
    """Devuelve el modelo Gemini, o None si no está disponible/configurado."""
    global _model
    if not GEMINI_AVAILABLE:
        return None
    if not GEMINI_API_KEY:
        return None
    if _model is None:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            _model = genai.GenerativeModel(GEMINI_MODEL)
        except Exception as e:
            print(f"[IA] Error configurando Gemini: {e}")
            _model = None
    return _model


def ia_habilitada():
    """¿Está la capa de IA lista para usarse?"""
    return _get_model() is not None


def _gestionar_json(respuesta_texto):
    """Extrae y valida un JSON de una respuesta de Gemini (tolera markdown)."""
    texto = respuesta_texto.strip()
    # Quitar bloques de código markdown ```json ... ```
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', texto, re.DOTALL)
    if match:
        texto = match.group(1).strip()
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        # Intentar cortar a la primera llave-cierre balanceada
        try:
            inicio = texto.index('{')
            fin = texto.rindex('}')
            return json.loads(texto[inicio:fin + 1])
        except Exception:
            return None


def buscar_video_youtube(nombre_ejercicio):
    """
    Devuelve un buscador de YouTube (URL de búsqueda) para un ejercicio.
    NO usa la API de YouTube (gratis, sin key), generamos una query de búsqueda
    curada para que el frontend la use con embed/iframe del primer resultado.
    También se intenta que Gemini devuelva el ID exacto de un video oficial.
    """
    # Query de búsqueda standard y segura
    query = f"{nombre_ejercicio} correct form ejercicio tutorial"
    search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '%20')}"
    return search_url


def enriquecer_ejercicio(nombre_ejercicio, lesiones="", objetivo=""):
    """
    Pide a Gemini notas técnicas + video de YouTube para un ejercicio.
    Devuelve dict {'notas': str, 'video_query': str} o None si no hay IA.
    """
    model = _get_model()
    if model is None:
        return None

    prompt = f"""
Actúa como un entrenador fitness profesional y experto en español (México).

Dado el ejercicio: "{nombre_ejercicio}"
Contexto del usuario:
- Objetivo: {objetivo or 'general'}
- Lesiones/limitaciones: {lesiones or 'ninguna'}

Responde SOLO con JSON válido, sin texto adicional, con esta estructura exacta:
{{
  "notas": "2-3 oraciones en español describiendo la técnica correcta, puntos clave de forma y un consejo de seguridad. Si hay lesiones relevantes, sugiere una variante segura.",
  "video_query": "texto de búsqueda de YouTube en español, corto y preciso, p.ej: 'sentadilla correcta tecnica tutorial'"
}}
"""
    try:
        respuesta = model.generate_content(prompt)
        data = _gestionar_json(respuesta.text)
        if not data:
            return None
        return {
            "notas": str(data.get("notas", "")).strip(),
            "video_query": str(data.get("video_query", nombre_ejercicio)).strip(),
        }
    except Exception as e:
        print(f"[IA] Error generando contenido para '{nombre_ejercicio}': {e}")
        return None
