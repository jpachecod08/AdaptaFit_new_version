# workouts/views.py
import json
import traceback
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from .serializers import WorkoutPlanSerializer
from .models import WorkoutPlan, WorkoutDay, Exercise, UserProgress, WorkoutExercise
from users.models import UserProfile
from django.db.models import Count, Avg, Q
from . import ai_engine

print("=" * 60)
print("🧠 ADAPTAFIT - SISTEMA ADAPTATIVO CON IA")
print("✅ Rutinas que aprenden de tu progreso")
print("=" * 60)

# =============================================================================
# 📊 SISTEMA DE ANÁLISIS DE PROGRESO
# =============================================================================

class AnalisisProgreso:
    """Analiza el progreso del usuario y determina ajustes necesarios"""
    
    def __init__(self, user):
        self.user = user
        self.progreso_data = self.obtener_datos_progreso()
    
    def obtener_datos_progreso(self):
        """Recopila datos históricos del usuario"""
        hace_30_dias = timezone.now() - timedelta(days=30)
        
        ejercicios_completados = UserProgress.objects.filter(
            user=self.user,
            completed=True,
            completed_at__gte=hace_30_dias
        )
        
        total_ejercicios_asignados = WorkoutExercise.objects.filter(
            day__plan__user=self.user
        ).count()
        
        ejercicios_completados_count = ejercicios_completados.count()
        
        tasa_completitud = 0
        if total_ejercicios_asignados > 0:
            tasa_completitud = (ejercicios_completados_count / total_ejercicios_asignados) * 100
        
        racha = self.calcular_racha()
        dias_activos = ejercicios_completados.values('completed_at__date').distinct().count()
        
        ejercicios_por_categoria = {}
        for progress in ejercicios_completados:
            if progress.exercise:
                categoria = progress.exercise.category
                ejercicios_por_categoria[categoria] = ejercicios_por_categoria.get(categoria, 0) + 1
        
        return {
            'tasa_completitud': tasa_completitud,
            'racha_actual': racha,
            'dias_activos_mes': dias_activos,
            'total_ejercicios_completados': ejercicios_completados_count,
            'ejercicios_por_categoria': ejercicios_por_categoria,
            'ultimo_entrenamiento': ejercicios_completados.order_by('-completed_at').first()
        }
    
    def calcular_racha(self):
        today = timezone.now().date()
        racha = 0
        for i in range(30):
            check_date = today - timedelta(days=i)
            tiene_actividad = UserProgress.objects.filter(
                user=self.user,
                completed=True,
                completed_at__date=check_date
            ).exists()
            if tiene_actividad:
                racha += 1
            else:
                break
        return racha
    
    def determinar_nivel_actual(self):
        tasa = self.progreso_data['tasa_completitud']
        racha = self.progreso_data['racha_actual']
        dias_activos = self.progreso_data['dias_activos_mes']
        
        score = 0
        
        if tasa >= 90:
            score += 40
        elif tasa >= 75:
            score += 30
        elif tasa >= 50:
            score += 20
        else:
            score += 10
        
        if racha >= 14:
            score += 30
        elif racha >= 7:
            score += 20
        elif racha >= 3:
            score += 10
        
        if dias_activos >= 20:
            score += 30
        elif dias_activos >= 12:
            score += 20
        elif dias_activos >= 6:
            score += 10
        
        if score >= 70:
            return "avanzado"
        elif score >= 40:
            return "intermedio"
        else:
            return "principiante"
    
    def necesita_progresion(self):
        tasa = self.progreso_data['tasa_completitud']
        racha = self.progreso_data['racha_actual']
        if tasa >= 85 and racha >= 7:
            return True, "¡Excelente! Estás dominando tu rutina actual. Es hora de aumentar el desafío."
        return False, None
    
    def detectar_estancamiento(self):
        dias_activos = self.progreso_data['dias_activos_mes']
        tasa = self.progreso_data['tasa_completitud']
        if dias_activos < 8 and tasa < 50:
            return True, "Parece que has estado menos activo. Vamos a ajustar tu rutina para que sea más accesible."
        if tasa < 40:
            return True, "Veo que la rutina actual podría ser muy exigente. Vamos a reducir la intensidad."
        return False, None

# =============================================================================
# 🏋️ BASE DE CONOCIMIENTO EXPANDIDA CON PROGRESIONES
# =============================================================================

EJERCICIOS_DB = {
    "principiante": {
        "fuerza_superior": [
            {"name": "Flexiones de rodillas", "sets": 2, "reps": "8-10", "rest": 90, "notes": "Mantén el core activado"},
            {"name": "Flexiones en pared", "sets": 2, "reps": "12-15", "rest": 60, "notes": "Brazos al ancho de hombros"},
            {"name": "Press de hombros con botella", "sets": 2, "reps": "10-12", "rest": 60, "notes": "Movimiento controlado"},
            {"name": "Elevaciones laterales", "sets": 2, "reps": "10-12", "rest": 60, "notes": "Codos ligeramente flexionados"},
            {"name": "Remo con peso casero", "sets": 2, "reps": "10-12", "rest": 60, "notes": "Espalda recta"},
        ],
        "fuerza_inferior": [
            {"name": "Sentadillas asistidas", "sets": 2, "reps": "10-12", "rest": 90, "notes": "Usa una silla como soporte"},
            {"name": "Zancadas estáticas", "sets": 2, "reps": "8-10 por pierna", "rest": 60, "notes": "Rodilla a 90 grados"},
            {"name": "Elevación de talones", "sets": 3, "reps": "15-20", "rest": 45, "notes": "Contrae en la parte superior"},
            {"name": "Puente de glúteos", "sets": 2, "reps": "12-15", "rest": 60, "notes": "Aprieta glúteos arriba"},
            {"name": "Sentadilla sumo", "sets": 2, "reps": "10-12", "rest": 60, "notes": "Pies más separados"},
        ],
        "cardio": [
            {"name": "Marcha en el lugar", "sets": 3, "reps": "30 segundos", "rest": 30, "notes": "Eleva bien las rodillas"},
            {"name": "Jumping jacks suaves", "sets": 3, "reps": "20 segundos", "rest": 40, "notes": "Ritmo moderado"},
            {"name": "Step touch", "sets": 3, "reps": "30 segundos", "rest": 30, "notes": "Coordinación y ritmo"},
        ],
        "core": [
            {"name": "Plancha de rodillas", "sets": 3, "reps": "20-30 segundos", "rest": 45, "notes": "Espalda recta"},
            {"name": "Bird dog", "sets": 2, "reps": "8-10 por lado", "rest": 45, "notes": "Movimiento lento"},
            {"name": "Crunches básicos", "sets": 2, "reps": "12-15", "rest": 45, "notes": "No jales el cuello"},
        ],
    },
    "intermedio": {
        "fuerza_superior": [
            {"name": "Flexiones estándar", "sets": 3, "reps": "10-15", "rest": 60, "notes": "Pecho toca el suelo"},
            {"name": "Flexiones diamante", "sets": 3, "reps": "8-12", "rest": 60, "notes": "Manos juntas bajo el pecho"},
            {"name": "Pike push-ups", "sets": 3, "reps": "8-12", "rest": 60, "notes": "Enfocado en hombros"},
            {"name": "Fondos en silla", "sets": 3, "reps": "10-15", "rest": 60, "notes": "Trabaja tríceps"},
            {"name": "Remo invertido", "sets": 3, "reps": "8-12", "rest": 60, "notes": "Usa mesa o barra baja"},
            {"name": "Plancha a flexión", "sets": 3, "reps": "8-10", "rest": 60, "notes": "Transición controlada"},
        ],
        "fuerza_inferior": [
            {"name": "Sentadillas completas", "sets": 3, "reps": "12-15", "rest": 60, "notes": "Profundidad máxima"},
            {"name": "Zancadas alternas", "sets": 3, "reps": "10-12 por pierna", "rest": 60, "notes": "Paso largo"},
            {"name": "Sentadilla búlgara", "sets": 3, "reps": "10-12 por pierna", "rest": 60, "notes": "Pie trasero elevado"},
            {"name": "Peso muerto a una pierna", "sets": 3, "reps": "8-10 por pierna", "rest": 60, "notes": "Equilibrio y control"},
            {"name": "Saltos de sentadilla", "sets": 3, "reps": "8-12", "rest": 75, "notes": "Aterriza suave"},
            {"name": "Step-ups", "sets": 3, "reps": "10-12 por pierna", "rest": 60, "notes": "Usa banco o silla"},
        ],
        "cardio": [
            {"name": "Burpees modificados", "sets": 3, "reps": "8-12", "rest": 45, "notes": "Sin salto final"},
            {"name": "Mountain climbers", "sets": 3, "reps": "30 segundos", "rest": 30, "notes": "Ritmo rápido"},
            {"name": "High knees", "sets": 3, "reps": "30 segundos", "rest": 30, "notes": "Rodillas al pecho"},
            {"name": "Skaters", "sets": 3, "reps": "20 segundos", "rest": 30, "notes": "Salto lateral"},
        ],
        "core": [
            {"name": "Plancha estándar", "sets": 3, "reps": "45-60 segundos", "rest": 45, "notes": "Cuerpo recto"},
            {"name": "Plancha lateral", "sets": 3, "reps": "30-45 seg por lado", "rest": 45, "notes": "Cadera arriba"},
            {"name": "Russian twists", "sets": 3, "reps": "20-24 totales", "rest": 45, "notes": "Giro completo"},
            {"name": "Bicycle crunches", "sets": 3, "reps": "15-20 por lado", "rest": 45, "notes": "Codo a rodilla opuesta"},
        ],
    },
    "avanzado": {
        "fuerza_superior": [
            {"name": "Flexiones explosivas", "sets": 4, "reps": "8-12", "rest": 60, "notes": "Despega las manos"},
            {"name": "Flexiones archer", "sets": 4, "reps": "6-10 por lado", "rest": 75, "notes": "Peso en un brazo"},
            {"name": "Handstand push-ups", "sets": 4, "reps": "5-8", "rest": 90, "notes": "Pies en pared"},
            {"name": "Dominadas", "sets": 4, "reps": "8-12", "rest": 75, "notes": "Barbilla sobre barra"},
            {"name": "Fondos en paralelas", "sets": 4, "reps": "10-15", "rest": 60, "notes": "Descenso profundo"},
            {"name": "Muscle-up progression", "sets": 4, "reps": "4-6", "rest": 90, "notes": "Fase de transición"},
        ],
        "fuerza_inferior": [
            {"name": "Sentadillas pistol", "sets": 4, "reps": "6-8 por pierna", "rest": 90, "notes": "Una sola pierna"},
            {"name": "Sentadilla con salto alto", "sets": 4, "reps": "10-15", "rest": 75, "notes": "Explosividad máxima"},
            {"name": "Zancadas con salto", "sets": 4, "reps": "10-12 por pierna", "rest": 75, "notes": "Cambio en el aire"},
            {"name": "Box jumps altos", "sets": 4, "reps": "8-12", "rest": 75, "notes": "Altura desafiante"},
            {"name": "Nordic hamstring curls", "sets": 3, "reps": "6-8", "rest": 90, "notes": "Excéntrico fuerte"},
        ],
        "cardio": [
            {"name": "Burpees completos", "sets": 4, "reps": "12-15", "rest": 45, "notes": "Con salto y palmada"},
            {"name": "Sprint en el lugar", "sets": 5, "reps": "20 segundos", "rest": 20, "notes": "Máxima velocidad"},
            {"name": "Tuck jumps", "sets": 4, "reps": "10-12", "rest": 60, "notes": "Rodillas al pecho"},
            {"name": "Sprawls", "sets": 4, "reps": "12-15", "rest": 45, "notes": "Burpee sin flexión"},
        ],
        "core": [
            {"name": "Plancha RKC", "sets": 4, "reps": "30-45 segundos", "rest": 45, "notes": "Tensión máxima"},
            {"name": "L-sit hold", "sets": 4, "reps": "20-30 segundos", "rest": 60, "notes": "Piernas paralelas"},
            {"name": "Dragon flags", "sets": 3, "reps": "6-8", "rest": 90, "notes": "Control excéntrico"},
            {"name": "Ab wheel rollouts", "sets": 4, "reps": "10-12", "rest": 60, "notes": "Rango completo"},
        ],
    }
}

# =============================================================================
# SELECCIONAR BASE DE EJERCICIOS SEGÚN TIPO DE ENTRENAMIENTO
# =============================================================================

def obtener_base_ejercicios(tipo_entrenamiento, nivel):
    """
    Retorna la base de ejercicios correspondiente al tipo de entrenamiento
    y nivel del usuario.
    """
    # Base de ejercicios para GIMNASIO (pesas/máquinas)
    if tipo_entrenamiento == 'gym':
        base_gym = {
            "principiante": {
                "fuerza_superior": [
                    {"name": "Press de banca con mancuernas", "sets": 3, "reps": "8-10", "rest": 60, "notes": "Mantén los codos a 45 grados"},
                    {"name": "Curl de bíceps con mancuernas", "sets": 3, "reps": "10-12", "rest": 45, "notes": "No balancees el cuerpo"},
                    {"name": "Press militar con mancuernas", "sets": 3, "reps": "8-10", "rest": 60, "notes": "Mantén la espalda recta"},
                    {"name": "Remo con mancuerna", "sets": 3, "reps": "10-12", "rest": 60, "notes": "Contrae la espalda al final"},
                    {"name": "Extensiones de tríceps", "sets": 3, "reps": "10-12", "rest": 45, "notes": "Mantén los codos fijos"},
                ],
                "fuerza_inferior": [
                    {"name": "Sentadilla con barra", "sets": 3, "reps": "8-10", "rest": 90, "notes": "Mantén la espalda recta"},
                    {"name": "Peso muerto rumano", "sets": 3, "reps": "8-10", "rest": 90, "notes": "Flexiona las caderas, no la espalda"},
                    {"name": "Prensa de piernas", "sets": 3, "reps": "10-12", "rest": 60, "notes": "Controla el movimiento"},
                    {"name": "Curl femoral", "sets": 3, "reps": "12-15", "rest": 45, "notes": "Concéntrate en el isquiotibial"},
                    {"name": "Elevación de talones", "sets": 3, "reps": "15-20", "rest": 45, "notes": "Sube y baja controlado"},
                ],
                "cardio": [
                    {"name": "Caminata inclinada", "sets": 1, "reps": "20 minutos", "rest": 0, "notes": "Inclinación 5-10%, velocidad 3-4 km/h"},
                    {"name": "Bicicleta estática", "sets": 1, "reps": "15 minutos", "rest": 0, "notes": "Resistencia moderada"},
                ],
                "core": [
                    {"name": "Plancha", "sets": 3, "reps": "30 segundos", "rest": 30, "notes": "Cuerpo recto"},
                    {"name": "Crunches", "sets": 3, "reps": "15-20", "rest": 30, "notes": "No jales el cuello"},
                ],
            },
            "intermedio": {
                "fuerza_superior": [
                    {"name": "Press de banca con barra", "sets": 4, "reps": "8-10", "rest": 75, "notes": "Mantén los pies firmes"},
                    {"name": "Dominadas asistidas", "sets": 4, "reps": "6-8", "rest": 75, "notes": "Controla el descenso"},
                    {"name": "Press inclinado con mancuernas", "sets": 4, "reps": "8-10", "rest": 60, "notes": "Enfoque en pecho superior"},
                    {"name": "Remo con barra", "sets": 4, "reps": "8-10", "rest": 60, "notes": "Mantén la espalda recta"},
                    {"name": "Fondos en paralelas", "sets": 3, "reps": "8-10", "rest": 60, "notes": "No bajes demasiado"},
                ],
                "fuerza_inferior": [
                    {"name": "Sentadilla profunda con barra", "sets": 4, "reps": "8-10", "rest": 90, "notes": "Baja hasta paralelo"},
                    {"name": "Peso muerto convencional", "sets": 4, "reps": "5-8", "rest": 90, "notes": "Mantén la espalda neutra"},
                    {"name": "Hip thrust con barra", "sets": 4, "reps": "10-12", "rest": 60, "notes": "Aprieta los glúteos arriba"},
                    {"name": "Zancadas con barra", "sets": 3, "reps": "8-10 por pierna", "rest": 60, "notes": "Rodilla a 90 grados"},
                    {"name": "Elevación de talones con peso", "sets": 4, "reps": "12-15", "rest": 45, "notes": "Máximo rango de movimiento"},
                ],
                "cardio": [
                    {"name": "HIIT en bicicleta", "sets": 8, "reps": "20s esfuerzo / 10s descanso", "rest": 0, "notes": "Máxima intensidad en esfuerzo"},
                    {"name": "Remo ergómetro", "sets": 1, "reps": "10 minutos", "rest": 0, "notes": "Mantén ritmo constante"},
                ],
                "core": [
                    {"name": "Plancha con elevación de pierna", "sets": 3, "reps": "10 por lado", "rest": 45, "notes": "Mantén cadera estable"},
                    {"name": "Russian twist con peso", "sets": 3, "reps": "15 por lado", "rest": 45, "notes": "Gira desde el torso"},
                ],
            },
            "avanzado": {
                "fuerza_superior": [
                    {"name": "Press de banca con carga", "sets": 5, "reps": "5-8", "rest": 90, "notes": "Usa 80-85% de tu 1RM"},
                    {"name": "Dominadas con peso", "sets": 5, "reps": "6-8", "rest": 90, "notes": "Agrega peso controlado"},
                    {"name": "Press militar con barra", "sets": 5, "reps": "5-8", "rest": 90, "notes": "Mantén el core firme"},
                    {"name": "Remo con barra", "sets": 5, "reps": "8-10", "rest": 75, "notes": "Peso desafiante"},
                    {"name": "Fondos con peso", "sets": 4, "reps": "8-10", "rest": 75, "notes": "Controla el descenso"},
                ],
                "fuerza_inferior": [
                    {"name": "Sentadilla con carga máxima", "sets": 5, "reps": "5-8", "rest": 120, "notes": "Técnica perfecta"},
                    {"name": "Peso muerto con carga", "sets": 5, "reps": "5-8", "rest": 120, "notes": "Mantén la espalda neutra"},
                    {"name": "Sentadilla búlgara con peso", "sets": 4, "reps": "8-10 por pierna", "rest": 75, "notes": "Pie trasero elevado"},
                    {"name": "Peso muerto a una pierna", "sets": 4, "reps": "8-10 por pierna", "rest": 60, "notes": "Mantén el equilibrio"},
                ],
                "cardio": [
                    {"name": "Sprints en bicicleta", "sets": 10, "reps": "30s máximo / 30s descanso", "rest": 0, "notes": "Esfuerzo al 100%"},
                ],
                "core": [
                    {"name": "Plancha con peso", "sets": 4, "reps": "45 segundos", "rest": 45, "notes": "Agrega peso en la espalda"},
                    {"name": "Dragon flags", "sets": 4, "reps": "6-8", "rest": 60, "notes": "Controla el descenso"},
                ],
            },
        }
        return base_gym.get(nivel, base_gym["principiante"])
    
    # Base de ejercicios para CARDIO (correr, nadar, bici)
    elif tipo_entrenamiento == 'cardio':
        base_cardio = {
            "principiante": {
                "cardio": [
                    {"name": "Caminata", "sets": 1, "reps": "20 minutos", "rest": 0, "notes": "Ritmo cómodo"},
                    {"name": "Trote suave", "sets": 1, "reps": "15 minutos", "rest": 0, "notes": "Puedes hablar mientras trotas"},
                    {"name": "Bicicleta", "sets": 1, "reps": "20 minutos", "rest": 0, "notes": "Resistencia baja"},
                ],
                "core": [
                    {"name": "Plancha", "sets": 2, "reps": "20 segundos", "rest": 30, "notes": "Core activado"},
                ],
            },
            "intermedio": {
                "cardio": [
                    {"name": "Trote continuo", "sets": 1, "reps": "25 minutos", "rest": 0, "notes": "Ritmo constante"},
                    {"name": "Intervalos de carrera", "sets": 6, "reps": "2 min trote / 1 min carrera", "rest": 0, "notes": "Alterna intensidades"},
                    {"name": "Bicicleta intervalos", "sets": 6, "reps": "1 min alta / 1 min baja", "rest": 0, "notes": "Mantén cadencia"},
                ],
                "core": [
                    {"name": "Plancha", "sets": 3, "reps": "40 segundos", "rest": 30, "notes": "Mantén posición"},
                ],
            },
            "avanzado": {
                "cardio": [
                    {"name": "Carrera de ritmo", "sets": 1, "reps": "40 minutos", "rest": 0, "notes": "Ritmo desafiante"},
                    {"name": "Intervalos intensos", "sets": 10, "reps": "1 min sprint / 1 min trote", "rest": 0, "notes": "Máxima intensidad"},
                    {"name": "Bicicleta resistencia", "sets": 1, "reps": "30 minutos", "rest": 0, "notes": "Resistencia alta, cadencia 80-90"},
                ],
                "core": [
                    {"name": "Plancha dinámica", "sets": 4, "reps": "45 segundos", "rest": 30, "notes": "Añade movimiento de brazos"},
                ],
            },
        }
        return base_cardio.get(nivel, base_cardio["principiante"])
    
    # Base de ejercicios para YOGA (COMPLETA con nuevas categorías)
    elif tipo_entrenamiento == 'yoga':
        base_yoga = {
            "principiante": {
                "yoga_flow": [
                    {"name": "Saludo al sol A", "sets": 3, "reps": "3 rondas", "rest": 30, "notes": "Sincroniza respiración"},
                    {"name": "Secuencia de pie", "sets": 3, "reps": "2 rondas", "rest": 20, "notes": "Montaña -> Flexión -> Planca -> Perro"},
                ],
                "yoga_poses": [
                    {"name": "Postura de la montaña (Tadasana)", "sets": 2, "reps": "30 segundos", "rest": 10, "notes": "Pies firmes, brazos a los lados"},
                    {"name": "Perro boca abajo (Adho Mukha Svanasana)", "sets": 3, "reps": "30 segundos", "rest": 15, "notes": "Empuja el suelo, cadera arriba"},
                    {"name": "Postura del niño (Balasana)", "sets": 2, "reps": "1 minuto", "rest": 0, "notes": "Descansa y respira"},
                    {"name": "Gato-vaca (Marjaryasana-Bitilasana)", "sets": 3, "reps": "10 repeticiones", "rest": 0, "notes": "Moviliza columna"},
                ],
                "yoga_restorative": [
                    {"name": "Postura de la pierna en la pared (Viparita Karani)", "sets": 1, "reps": "5 minutos", "rest": 0, "notes": "Descanso profundo"},
                    {"name": "Savasana (cadáver)", "sets": 1, "reps": "5 minutos", "rest": 0, "notes": "Relajación total"},
                ],
                "yoga_meditation": [
                    {"name": "Respiración consciente (Pranayama)", "sets": 1, "reps": "5 minutos", "rest": 0, "notes": "Inhala 4s, retén 4s, exhala 4s"},
                ],
            },
            "intermedio": {
                "yoga_flow": [
                    {"name": "Saludo al sol B", "sets": 4, "reps": "4 rondas", "rest": 20, "notes": "Incluye Guerrero I"},
                    {"name": "Secuencia de guerreros", "sets": 3, "reps": "3 rondas", "rest": 15, "notes": "Guerrero I, II, III"},
                ],
                "yoga_poses": [
                    {"name": "Guerrero I (Virabhadrasana I)", "sets": 3, "reps": "45 segundos por lado", "rest": 10, "notes": "Cadera cuadrada"},
                    {"name": "Guerrero II (Virabhadrasana II)", "sets": 3, "reps": "45 segundos por lado", "rest": 10, "notes": "Mirada sobre la mano"},
                    {"name": "Postura del árbol (Vrksasana)", "sets": 3, "reps": "30 segundos por lado", "rest": 10, "notes": "Equilibrio y enfoque"},
                    {"name": "Postura del triángulo (Trikonasana)", "sets": 3, "reps": "30 segundos por lado", "rest": 10, "notes": "Estira lateral"},
                ],
                "yoga_restorative": [
                    {"name": "Postura del puente (Setu Bandhasana)", "sets": 3, "reps": "30 segundos", "rest": 15, "notes": "Eleva cadera"},
                    {"name": "Savasana", "sets": 1, "reps": "10 minutos", "rest": 0, "notes": "Relajación profunda"},
                ],
                "yoga_meditation": [
                    {"name": "Respiración alterna (Nadi Shodhana)", "sets": 1, "reps": "5 minutos", "rest": 0, "notes": "Equilibra energías"},
                ],
            },
            "avanzado": {
                "yoga_flow": [
                    {"name": "Secuencia avanzada", "sets": 5, "reps": "5 rondas", "rest": 10, "notes": "Incluye posturas de equilibrio"},
                    {"name": "Flow de transiciones", "sets": 4, "reps": "1 minuto", "rest": 10, "notes": "Movimiento fluido"},
                ],
                "yoga_poses": [
                    {"name": "Postura del cuervo (Bakasana)", "sets": 3, "reps": "20 segundos", "rest": 30, "notes": "Equilibrio de brazos"},
                    {"name": "Postura de la rueda (Chakrasana)", "sets": 3, "reps": "15 segundos", "rest": 30, "notes": "Apertura de pecho"},
                    {"name": "Pincha mayurasana", "sets": 3, "reps": "15 segundos", "rest": 45, "notes": "Antebrazo parado"},
                ],
                "yoga_restorative": [
                    {"name": "Postura del loto (Padmasana)", "sets": 3, "reps": "1 minuto", "rest": 10, "notes": "Meditación"},
                ],
            },
        }
        return base_yoga.get(nivel, base_yoga["principiante"])
    
    # Para MIXED o CALISTHENICS (usar la base existente EJERCICIOS_DB)
    else:  # mixed o calisthenics
        base_calistenia = {
            "principiante": EJERCICIOS_DB["principiante"],
            "intermedio": EJERCICIOS_DB["intermedio"],
            "avanzado": EJERCICIOS_DB["avanzado"],
        }
        return base_calistenia.get(nivel, base_calistenia["principiante"])


# =============================================================================
# 🎯 MOTOR DE GENERACIÓN ADAPTATIVA (MODIFICADO CON SPLITS POR TIPO)
# =============================================================================

def generar_rutina_adaptativa(user_profile):
    """Genera rutina que se adapta al progreso del usuario y a su tipo de entrenamiento preferido"""
    try:
        print(f"\n{'='*60}")
        print(f"[ADAPTATIVA] Analizando progreso de: {user_profile.user.nombre}")
        
        analisis = AnalisisProgreso(user_profile.user)
        nivel_declarado = user_profile.experiencia.lower()
        nivel_real = analisis.determinar_nivel_actual()
        
        print(f"[ADAPTATIVA] Nivel declarado: {nivel_declarado}")
        print(f"[ADAPTATIVA] Nivel basado en progreso: {nivel_real}")
        print(f"[ADAPTATIVA] Tasa de completitud: {analisis.progreso_data['tasa_completitud']:.1f}%")
        print(f"[ADAPTATIVA] Racha actual: {analisis.progreso_data['racha_actual']} días")
        print(f"[ADAPTATIVA] Días activos (30d): {analisis.progreso_data['dias_activos_mes']}")
        
        necesita_prog, mensaje_prog = analisis.necesita_progresion()
        estancado, mensaje_estancado = analisis.detectar_estancamiento()
        
        if estancado:
            print(f"[ADAPTATIVA] ⚠️ ESTANCAMIENTO DETECTADO: {mensaje_estancado}")
            if nivel_real == "avanzado":
                nivel_a_usar = "intermedio"
            elif nivel_real == "intermedio":
                nivel_a_usar = "principiante"
            else:
                nivel_a_usar = "principiante"
        elif necesita_prog:
            print(f"[ADAPTATIVA] 🚀 PROGRESIÓN DETECTADA: {mensaje_prog}")
            if nivel_real == "principiante":
                nivel_a_usar = "intermedio"
            elif nivel_real == "intermedio":
                nivel_a_usar = "avanzado"
            else:
                nivel_a_usar = "avanzado"
        else:
            nivel_a_usar = nivel_real
        
        print(f"[ADAPTATIVA] ✅ Nivel seleccionado: {nivel_a_usar}")
        
        tipo_entrenamiento = getattr(user_profile, 'training_type', 'calisthenics')
        print(f"[ADAPTATIVA] 🏋️ Tipo de entrenamiento seleccionado: {tipo_entrenamiento}")
        
        ejercicios_por_tipo = obtener_base_ejercicios(tipo_entrenamiento, nivel_a_usar)
        
        frecuencia = user_profile.frecuencia or 3
        objetivo = user_profile.objetivo.lower()
        
        # ========== SPLIT SEGÚN TIPO DE ENTRENAMIENTO ==========
        if tipo_entrenamiento == 'yoga':
            # Split específico para Yoga
            if frecuencia <= 2:
                split = ["yoga_flow", "yoga_restorative"]
            elif frecuencia == 3:
                split = ["yoga_flow", "yoga_poses", "yoga_restorative"]
            elif frecuencia == 4:
                split = ["yoga_flow", "yoga_poses", "yoga_flow", "yoga_restorative"]
            elif frecuencia == 5:
                split = ["yoga_flow", "yoga_poses", "yoga_flow", "yoga_restorative", "yoga_meditation"]
            else:
                split = ["yoga_flow", "yoga_poses", "yoga_flow", "yoga_restorative", "yoga_meditation", "yoga_flow", "yoga_poses"]
        
        elif tipo_entrenamiento == 'cardio':
            # Split específico para Cardio
            if frecuencia <= 2:
                split = ["cardio", "cardio"]
            elif frecuencia == 3:
                split = ["cardio", "cardio", "cardio"]
            elif frecuencia == 4:
                split = ["cardio", "cardio", "cardio", "core"]
            else:
                split = ["cardio", "cardio", "cardio", "core", "cardio", "cardio", "core"]
        
        else:
            # Split original para gym, calisthenics, mixed
            if frecuencia <= 2:
                split = ["fullbody", "fullbody"]
            elif frecuencia == 3:
                split = ["superior", "inferior", "fullbody"]
            elif frecuencia == 4:
                split = ["superior", "inferior", "superior", "cardio_core"]
            elif frecuencia == 5:
                split = ["superior", "inferior", "superior", "inferior", "cardio_core"]
            else:
                split = ["superior", "inferior", "superior", "inferior", "cardio", "core", "fullbody"]
        # ========================================================
        
        days = []
        mensaje_motivacional = ""
        
        if necesita_prog:
            mensaje_motivacional = f"\n\n💪 {mensaje_prog}\n+1 nivel de dificultad aplicado."
        elif estancado:
            mensaje_motivacional = f"\n\n🎯 {mensaje_estancado}\nRutina ajustada para retomar el ritmo."
        else:
            mensaje_motivacional = f"\n\n✨ Rutina adaptada a tu nivel actual.\nSigue así para desbloquear nuevos desafíos."
        
        for day_num, tipo_dia in enumerate(split[:frecuencia], 1):
            ejercicios_dia = []
            
            # ========== Tipos de Yoga ==========
            if tipo_dia == "yoga_flow":
                ejercicios_dia = ejercicios_por_tipo.get("yoga_flow", [])[:6]
                nombre_dia = f"Día {day_num}: Flujo de Yoga"
                
            elif tipo_dia == "yoga_poses":
                ejercicios_dia = ejercicios_por_tipo.get("yoga_poses", [])[:6]
                nombre_dia = f"Día {day_num}: Posturas de Yoga"
                
            elif tipo_dia == "yoga_restorative":
                ejercicios_dia = ejercicios_por_tipo.get("yoga_restorative", [])[:5]
                nombre_dia = f"Día {day_num}: Yoga Restaurativo"
                
            elif tipo_dia == "yoga_meditation":
                ejercicios_dia = ejercicios_por_tipo.get("yoga_meditation", [])[:3]
                nombre_dia = f"Día {day_num}: Meditación y Respiración"
            
            # ========== Tipos de Cardio ==========
            elif tipo_dia == "cardio":
                ejercicios_dia = ejercicios_por_tipo.get("cardio", [])[:5]
                nombre_dia = f"Día {day_num}: Cardio"
            
            # ========== Tipos originales ==========
            elif tipo_dia == "superior":
                ejercicios_dia = ejercicios_por_tipo.get("fuerza_superior", [])[:5]
                nombre_dia = f"Día {day_num}: Fuerza - Tren Superior"
                
            elif tipo_dia == "inferior":
                ejercicios_dia = ejercicios_por_tipo.get("fuerza_inferior", [])[:5]
                nombre_dia = f"Día {day_num}: Fuerza - Tren Inferior"
                
            elif tipo_dia == "fullbody":
                superior = ejercicios_por_tipo.get("fuerza_superior", [])[:3]
                inferior = ejercicios_por_tipo.get("fuerza_inferior", [])[:2]
                ejercicios_dia = superior + inferior
                nombre_dia = f"Día {day_num}: Full Body"
                
            elif tipo_dia == "cardio_core":
                cardio = ejercicios_por_tipo.get("cardio", [])[:3]
                core = ejercicios_por_tipo.get("core", [])[:3]
                ejercicios_dia = cardio + core
                nombre_dia = f"Día {day_num}: Cardio + Core"
                
            else:  # core
                ejercicios_dia = ejercicios_por_tipo.get("core", [])[:5]
                nombre_dia = f"Día {day_num}: Core y Estabilidad"
            
            # Ajustar según objetivo (solo para tipos que tengan sets/reps)
            if tipo_dia not in ["yoga_flow", "yoga_poses", "yoga_restorative", "yoga_meditation", "cardio"]:
                ejercicios_ajustados = ajustar_por_objetivo(ejercicios_dia.copy(), objetivo)
            else:
                ejercicios_ajustados = ejercicios_dia
            
            ejercicios_formateados = []
            for ej in ejercicios_ajustados:
                ejercicios_formateados.append({
                    "name": ej["name"],
                    "sets": ej.get("sets", 1),
                    "reps": ej.get("reps", ""),
                    "rest_seconds": ej.get("rest", 0),
                    "notes": ej.get("notes", "")
                })
            
            days.append({
                "name": nombre_dia,
                "exercises": ejercicios_formateados
            })
        
        rutina = {
            "title": f"Plan Adaptativo - {user_profile.user.nombre} ({tipo_entrenamiento})",
            "days": days,
            "metadata": {
                "nivel_usado": nivel_a_usar,
                "nivel_declarado": nivel_declarado,
                "tipo_entrenamiento": tipo_entrenamiento,
                "progreso_detectado": necesita_prog,
                "estancamiento_detectado": estancado,
                "tasa_completitud": analisis.progreso_data['tasa_completitud'],
                "mensaje": mensaje_motivacional.strip()
            }
        }
        
        print(f"[ADAPTATIVA] ✅ Rutina generada: {len(days)} días para tipo: {tipo_entrenamiento}")
        print(f"{'='*60}\n")
        
        return rutina
        
    except Exception as e:
        print(f"[ADAPTATIVA] ❌ Error: {e}")
        traceback.print_exc()
        return None


def ajustar_por_objetivo(ejercicios, objetivo):
    """Ajusta parámetros según el objetivo del usuario"""
    for ej in ejercicios:
        if "perder peso" in objetivo or "quemar grasa" in objetivo:
            if isinstance(ej["reps"], str) and "-" in ej["reps"]:
                rango = ej["reps"].split("-")
                if len(rango) == 2:
                    try:
                        nuevo_min = int(rango[0]) + 3
                        nuevo_max = int(rango[1].split()[0]) + 5
                        ej["reps"] = f"{nuevo_min}-{nuevo_max}"
                    except:
                        pass
            ej["rest"] = max(20, ej["rest"] - 15)
            
        elif "ganar músculo" in objetivo or "hipertrofia" in objetivo:
            ej["sets"] = min(5, ej["sets"] + 1)
            
        elif "fuerza" in objetivo:
            if isinstance(ej["reps"], str) and "-" in ej["reps"]:
                rango = ej["reps"].split("-")
                if len(rango) == 2:
                    try:
                        nuevo_min = max(3, int(rango[0]) - 2)
                        nuevo_max = int(rango[1].split()[0]) - 2
                        ej["reps"] = f"{nuevo_min}-{nuevo_max}"
                    except:
                        pass
            ej["rest"] = ej["rest"] + 30
    
    return ejercicios

# =============================================================================
# 💬 CHAT ASISTENTE CON ANÁLISIS DE PROGRESO
# =============================================================================

def chat_asistente_inteligente(user_profile, pregunta):
    """Chat que considera el progreso del usuario"""
    try:
        pregunta_lower = pregunta.lower()
        nombre = user_profile.user.nombre
        
        analisis = AnalisisProgreso(user_profile.user)
        
        if any(palabra in pregunta_lower for palabra in ["progreso", "como voy", "avance", "mejorando"]):
            tasa = analisis.progreso_data['tasa_completitud']
            racha = analisis.progreso_data['racha_actual']
            dias_activos = analisis.progreso_data['dias_activos_mes']
            
            if tasa >= 80:
                evaluacion = "¡Excelente! 🌟"
            elif tasa >= 60:
                evaluacion = "¡Muy bien! 💪"
            elif tasa >= 40:
                evaluacion = "Buen progreso 👍"
            else:
                evaluacion = "Sigamos trabajando 💪"
            
            return f"""📊 **Tu Progreso, {nombre}:**

{evaluacion}

- **Tasa de completitud:** {tasa:.1f}%
- **Racha actual:** {racha} días consecutivos
- **Días activos (últimos 30):** {dias_activos} días
- **Ejercicios completados:** {analisis.progreso_data['total_ejercicios_completados']}

{'🔥 ¡Vas increíble! Sigue así.' if tasa >= 70 else '💡 Tip: La constancia es clave. Intenta entrenar al menos 3 días por semana.'}"""

        elif any(palabra in pregunta_lower for palabra in ["siguiente nivel", "subir nivel", "mas dificil"]):
            necesita_prog, mensaje = analisis.necesita_progresion()
            
            if necesita_prog:
                return f"✅ {mensaje}\n\nRegenera tu plan para obtener una rutina más desafiante."
            else:
                tasa = analisis.progreso_data['tasa_completitud']
                racha = analisis.progreso_data['racha_actual']
                return f"""🎯 Para avanzar al siguiente nivel necesitas:

- Completar al menos el 85% de tus ejercicios (actual: {tasa:.1f}%)
- Mantener una racha de 7+ días (actual: {racha} días)

{'¡Estás cerca! Sigue así.' if tasa >= 70 else '¡Tú puedes lograrlo! Mantén la constancia.'}"""

        elif any(palabra in pregunta_lower for palabra in ["motivacion", "animo", "cansado"]):
            racha = analisis.progreso_data['racha_actual']
            
            if racha >= 7:
                return f"¡{nombre}, llevas {racha} días de racha! 🔥 Eso es dedicación pura. ¡No pares ahora!"
            elif racha >= 3:
                return f"¡Bien hecho, {nombre}! {racha} días seguidos. 💪 Cada día cuenta. ¡Vamos por más!"
            else:
                return f"¡Arriba, {nombre}! 💪 Cada entrenamiento te acerca a tu objetivo. ¡Hoy es un buen día para entrenar!"

        elif any(palabra in pregunta_lower for palabra in ["comer", "dieta", "nutricion", "alimentacion"]):
            objetivo = user_profile.objetivo.lower()
            
            if "perder" in objetivo:
                return f"""🥗 **Nutrición para perder peso, {nombre}:**

**Prioriza:**
- Proteínas magras (pollo, pescado, huevos)
- Verduras (brócoli, espinaca, ensaladas)
- Carbohidratos complejos (avena, arroz integral)

**Reduce:**
- Azúcares procesados
- Frituras y comida rápida
- Bebidas azucaradas

💡 **Tip:** Crea un déficit calórico moderado (300-500 cal/día)."""
            
            elif "ganar" in objetivo or "músculo" in objetivo:
                return f"""🍗 **Nutrición para ganar músculo, {nombre}:**

**Prioriza:**
- Proteínas (1.6-2g por kg de peso corporal)
- Carbohidratos (avena, arroz, pasta, batata)
- Grasas saludables (aguacate, nueces, aceite de oliva)

**Timing:**
- Proteína después de entrenar
- Carbohidratos pre y post entreno

💡 **Tip:** Superávit calórico moderado (+300-500 cal/día)."""
            
            else:
                return """🍽️ **Nutrición balanceada:**

- 50% carbohidratos complejos
- 30% proteínas magras
- 20% grasas saludables

💧 Bebe 2-3 litros de agua al día
🥗 Come 5 porciones de frutas/verduras
⏰ 5-6 comidas pequeñas al día"""

        elif any(palabra in pregunta_lower for palabra in ["descanso", "recuperacion", "dormir"]):
            return f"""😴 **Importancia del descanso, {nombre}:**

**Recomendaciones:**
- 7-9 horas de sueño diario
- 1-2 días de descanso activo por semana
- Estiramientos después de entrenar

**¿Por qué es importante?**
- Los músculos crecen durante el descanso
- Previene lesiones
- Mejora el rendimiento

💡 **Escucha tu cuerpo:** Si sientes fatiga extrema, toma un día extra."""

        else:
            tipo_entrenamiento = getattr(user_profile, 'training_type', 'calisthenics')
            return f"""Hola {nombre}, entiendo tu pregunta sobre '{pregunta[:40]}...'.

Según tu progreso actual:
- Completitud: {analisis.progreso_data['tasa_completitud']:.1f}%
- Racha: {analisis.progreso_data['racha_actual']} días
- Tipo de entrenamiento: {tipo_entrenamiento}

💡 **Recomendaciones:**
1. Mantén la constancia
2. Enfócate en la técnica
3. Progresa gradualmente
4. Descansa adecuadamente

¿Necesitas ayuda con algún ejercicio específico o sobre tu progreso?"""

    except Exception as e:
        print(f"[CHAT] Error: {e}")
        return "Hubo un error. ¿Podrías reformular tu pregunta?"

# =============================================================================
# ENDPOINTS DE API
# =============================================================================

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def chat_asistente(request):
    pregunta = request.data.get("prompt", "").strip()
    
    if not pregunta:
        return Response({"error": "No se recibió pregunta"}, status=400)
    
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response({
            "answer": "Por favor, completa tu perfil primero."
        })
    
    respuesta = chat_asistente_inteligente(user_profile, pregunta)
    return Response({"answer": respuesta})

def generar_y_guardar_plan(user):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    if not isinstance(user, User):
        return None

    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        print(f"[PLAN] No existe perfil para usuario {user.id}")
        return None

    # Asegurar que los campos mínimos necesarios tengan valores válidos
    # (no bloquear la generación por datos físicos opcionales como
    # fechaNacimiento/altura/peso, que el generador no requiere para armar la rutina)
    if not profile.objetivo:
        profile.objetivo = 'general'
    if not profile.experiencia:
        profile.experiencia = 'principiante'
    if not profile.frecuencia:
        profile.frecuencia = 3
    if not getattr(profile, 'training_type', None):
        profile.training_type = 'calisthenics'

    print(f"[PLAN] Perfil listo para generar rutina "
          f"(objetivo={profile.objetivo}, experiencia={profile.experiencia}, "
          f"frecuencia={profile.frecuencia})")

    rutina_data = generar_rutina_adaptativa(profile)
    
    if not rutina_data:
        return None

    try:
        plan = WorkoutPlan.objects.create(
            title=rutina_data.get("title", f"Plan - {user.nombre}"),
            generated_at=timezone.now(),
            user=user
        )
        
        metadata = rutina_data.get("metadata", {})
        
        for idx, day in enumerate(rutina_data.get("days", [])):
            day_obj = WorkoutDay.objects.create(
                plan=plan,
                name=day.get("name", f"Día {idx+1}"),
                day_index=idx
            )
            
            for ex in day.get("exercises", []):
                exercise_name = ex.get("name", "").strip() or "Ejercicio"
                
                exercise_obj, _ = Exercise.objects.get_or_create(
                    name=exercise_name,
                    defaults={
                        'category': 'fuerza',
                        'equipment': 'ninguno',
                        'description': ex.get("notes", ""),
                        'difficulty': 3,
                        'video_query': exercise_name,
                    }
                )
                
                # Capa de IA (opcional, con fallback al motor determinista)
                notas_ejercicio = ex.get("notes", "")
                video_query = exercise_name
                if ai_engine.ia_habilitada():
                    enriquecido = ai_engine.enriquecer_ejercicio(
                        exercise_name,
                        lesiones=(profile.lesiones or ""),
                        objetivo=(profile.objetivo or ""),
                    )
                    if enriquecido:
                        notas_ejercicio = enriquecido.get("notas") or notas_ejercicio
                        video_query = enriquecido.get("video_query") or exercise_name
                        if exercise_obj.video_query != video_query or not exercise_obj.video_url:
                            exercise_obj.video_query = video_query
                            exercise_obj.save()
                
                WorkoutExercise.objects.create(
                    day=day_obj,
                    exercise=exercise_obj,
                    name=exercise_name,
                    sets=ex.get("sets", 3),
                    reps=str(ex.get("reps", "8-12")),
                    rest_seconds=ex.get("rest_seconds", 60),
                    notes=notas_ejercicio
                )

        print(f"[PLAN] ✅ Plan adaptativo guardado (ID: {plan.id})")
        
        return plan, metadata
        
    except Exception as e:
        print(f"[PLAN] ❌ Error: {e}")
        traceback.print_exc()
        if 'plan' in locals():
            plan.delete()
        return None

def calculate_current_streak(user):
    today = timezone.now().date()
    streak = 0
    for i in range(30):
        check_date = today - timedelta(days=i)
        has_workout = UserProgress.objects.filter(
            user=user, completed=True, completed_at__date=check_date
        ).exists()
        if has_workout:
            streak += 1
        else:
            break
    return streak

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_stats(request):
    try:
        user = request.user
        today = timezone.now().date()
        streak = calculate_current_streak(user)
        total_workouts = WorkoutPlan.objects.filter(user=user).count()
        completed_workouts = UserProgress.objects.filter(
            user=user, completed=True
        ).values('exercise__workoutexercise__day').distinct().count()
        total_exercises = WorkoutExercise.objects.filter(day__plan__user=user).count()
        completed_exercises = UserProgress.objects.filter(user=user, completed=True).count()
        
        week_start = today - timedelta(days=today.weekday())
        weekly_progress = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            day_completed = UserProgress.objects.filter(
                user=user, completed=True, completed_at__date=day_date
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
        return Response({'error': 'Error'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def today_workout(request):
    try:
        user = request.user
        today = timezone.now().date()
        day_of_week = today.weekday()
        active_plan = WorkoutPlan.objects.filter(user=user).latest('generated_at')
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
            'exercises': [{
                'id': ex.id,
                'name': ex.name,
                'sets': ex.sets,
                'reps': ex.reps,
                'rest_seconds': ex.rest_seconds,
                'notes': ex.notes,
                'completed': UserProgress.objects.filter(
                    user=user, exercise=ex.exercise, completed=True
                ).exists() if ex.exercise else False
            } for ex in exercises],
            'total_exercises': exercises.count(),
            'completed_exercises': completed_exercises
        })
    except WorkoutPlan.DoesNotExist:
        return Response({'error': 'No tienes plan activo'}, status=404)
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def complete_exercise(request):
    try:
        workout_exercise_id = request.data.get('exercise_id')
        if not workout_exercise_id:
            return Response({'error': 'ID requerido'}, status=400)
        
        workout_exercise = WorkoutExercise.objects.get(id=workout_exercise_id)
        
        if workout_exercise.exercise:
            exercise = workout_exercise.exercise
        else:
            exercise, _ = Exercise.objects.get_or_create(
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
        
        progress, created = UserProgress.objects.get_or_create(
            user=request.user,
            exercise=exercise,
            defaults={'completed': True, 'completed_at': timezone.now()}
        )
        
        if not created:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()
        
        return Response({'success': True})
    except WorkoutExercise.DoesNotExist:
        return Response({'error': 'Ejercicio no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def completed_exercises(request):
    try:
        completed_exercise_ids = UserProgress.objects.filter(
            user=request.user, completed=True
        ).values_list('exercise_id', flat=True)
        
        completed_workout_exercise_ids = WorkoutExercise.objects.filter(
            exercise_id__in=completed_exercise_ids
        ).values_list('id', flat=True)
        
        return Response({'completed_exercises': list(completed_workout_exercise_ids)})
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def complete_workout(request):
    try:
        workout_id = request.data.get('workout_id')
        if not workout_id:
            return Response({'error': 'ID requerido'}, status=400)
        
        workout_day = WorkoutDay.objects.get(id=workout_id)
        exercises = workout_day.workout_exercises.all()
        
        completed_count = 0
        for workout_exercise in exercises:
            if workout_exercise.exercise:
                progress, created = UserProgress.objects.get_or_create(
                    user=request.user,
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
            'message': f'{completed_count} ejercicios completados'
        })
    except WorkoutDay.DoesNotExist:
        return Response({'error': 'Entrenamiento no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def plan_detail(request, plan_id):
    try:
        plan = WorkoutPlan.objects.get(id=plan_id, user=request.user)
        serializer = WorkoutPlanSerializer(plan)
        return Response(serializer.data)
    except WorkoutPlan.DoesNotExist:
        return Response({'error': 'Plan no encontrado'}, status=404)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def plan_por_usuario(request, user_id):
    try:
        if int(user_id) != request.user.id and not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=403)

        plan = WorkoutPlan.objects.filter(user_id=user_id).order_by('-generated_at').first()

        if plan:
            serializer = WorkoutPlanSerializer(plan)
            analisis = AnalisisProgreso(request.user)
            
            response_data = serializer.data
            response_data['progreso'] = {
                'tasa_completitud': analisis.progreso_data['tasa_completitud'],
                'racha_actual': analisis.progreso_data['racha_actual'],
                'dias_activos_mes': analisis.progreso_data['dias_activos_mes']
            }
            
            return Response(response_data)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_obj = request.user if int(user_id) == request.user.id else User.objects.get(id=user_id)
        
        result = generar_y_guardar_plan(user_obj)
        
        if not result:
            return Response({'error': 'No se pudo generar la rutina'}, status=400)
        
        if isinstance(result, tuple):
            plan, metadata = result
        else:
            plan = result
            metadata = {}

        serializer = WorkoutPlanSerializer(plan)
        response_data = serializer.data
        response_data['metadata'] = metadata
        
        return Response(response_data)

    except Exception as e:
        print(f"[PLAN_USUARIO] Error: {e}")
        traceback.print_exc()
        return Response({'error': 'Error interno'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def mis_planes(request):
    try:
        planes = WorkoutPlan.objects.filter(user=request.user).order_by('-generated_at')
        serializer = WorkoutPlanSerializer(planes, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def regenerar_plan(request, user_id):
    try:
        if int(user_id) != request.user.id and not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=403)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_obj = request.user if int(user_id) == request.user.id else User.objects.get(id=user_id)
        
        result = generar_y_guardar_plan(user_obj)
        
        if not result:
            return Response({'error': 'No se pudo regenerar'}, status=400)

        if isinstance(result, tuple):
            plan, metadata = result
        else:
            plan = result
            metadata = {}

        serializer = WorkoutPlanSerializer(plan)
        response_data = {
            'message': 'Plan regenerado exitosamente',
            'plan': serializer.data
        }
        
        if metadata:
            response_data['metadata'] = metadata
        
        return Response(response_data)

    except Exception as e:
        return Response({'error': 'Error'}, status=500)

def es_entrenador_o_superusuario(user):
    try:
        if hasattr(user, 'role'):
            return user.role == 'entrenador' or user.is_superuser
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
    try:
        if not es_entrenador_o_superusuario(request.user):
            return Response({'error': 'Solo entrenadores'}, status=403)
        
        workout_exercise = WorkoutExercise.objects.get(id=exercise_id)
        data = request.data
        
        if 'name' in data:
            workout_exercise.name = data['name']
        if 'sets' in data:
            workout_exercise.sets = data['sets']
        if 'reps' in data:
            workout_exercise.reps = data['reps']
        if 'rest_seconds' in data:
            workout_exercise.rest_seconds = data['rest_seconds']
        if 'notes' in data:
            workout_exercise.notes = data['notes']
        # Permitir al entrenador fijar la URL del video ilustrativo del ejercicio
        if 'video_url' in data and workout_exercise.exercise:
            workout_exercise.exercise.video_url = data['video_url'] or ''
            workout_exercise.exercise.save()
        
        workout_exercise.save()
        plan = workout_exercise.day.plan
        plan.last_modified = timezone.now()
        plan.save()
        
        return Response({
            'success': True,
            'message': 'Ejercicio actualizado',
            'exercise': {
                'id': workout_exercise.id,
                'name': workout_exercise.name,
                'sets': workout_exercise.sets,
                'reps': workout_exercise.reps,
                'rest_seconds': workout_exercise.rest_seconds,
                'notes': workout_exercise.notes,
                'video_url': workout_exercise.exercise.video_url if workout_exercise.exercise else '',
            }
        })
    except WorkoutExercise.DoesNotExist:
        return Response({'error': 'Ejercicio no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_role(request):
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
        return Response({'role': 'usuario', 'is_trainer': False, 'is_superuser': False}, status=200)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def check_plan_updates(request, plan_id):
    try:
        plan = WorkoutPlan.objects.get(id=plan_id, user=request.user)
        last_modified_param = request.query_params.get('last_modified')
        
        if last_modified_param:
            try:
                last_modified_from_client = timezone.datetime.fromisoformat(
                    last_modified_param.replace('Z', '+00:00')
                )
                modified = plan.last_modified > last_modified_from_client
            except:
                modified = True
        else:
            modified = True
        
        return Response({
            'modified': modified,
            'last_modified': plan.last_modified,
            'plan_id': plan.id
        })
    except WorkoutPlan.DoesNotExist:
        return Response({'error': 'Plan no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_plan(request, plan_id):
    try:
        plan = WorkoutPlan.objects.get(id=plan_id, user=request.user)
        plan.delete()
        return Response({'success': True, 'message': 'Plan eliminado'})
    except WorkoutPlan.DoesNotExist:
        return Response({'error': 'Plan no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': 'Error'}, status=500)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def analisis_progreso(request):
    try:
        analisis = AnalisisProgreso(request.user)
        nivel_real = analisis.determinar_nivel_actual()
        necesita_prog, mensaje_prog = analisis.necesita_progresion()
        estancado, mensaje_estancado = analisis.detectar_estancamiento()
        
        return Response({
            'nivel_actual': nivel_real,
            'tasa_completitud': analisis.progreso_data['tasa_completitud'],
            'racha_actual': analisis.progreso_data['racha_actual'],
            'dias_activos_mes': analisis.progreso_data['dias_activos_mes'],
            'total_ejercicios_completados': analisis.progreso_data['total_ejercicios_completados'],
            'necesita_progresion': necesita_prog,
            'mensaje_progresion': mensaje_prog,
            'estancamiento_detectado': estancado,
            'mensaje_estancamiento': mensaje_estancado,
            'ejercicios_por_categoria': analisis.progreso_data['ejercicios_por_categoria']
        })
    except Exception as e:
        print(f"[ANALISIS] Error: {e}")
        return Response({'error': 'Error al analizar progreso'}, status=500)