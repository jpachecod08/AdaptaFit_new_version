# workouts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Planes de entrenamiento
    path('plans/<int:plan_id>/', views.plan_detail, name='plan-detail'),
    path('plans/usuario/<int:user_id>/', views.plan_por_usuario, name='plan-por-usuario'),
    path('mis-planes/', views.mis_planes, name='mis_planes'),
    path('regenerar-plan/<int:user_id>/', views.regenerar_plan, name='regenerar_plan'),
    path('plans/<int:plan_id>/check-updates/', views.check_plan_updates, name='check-plan-updates'),
    path('delete-plan/<int:plan_id>/', views.delete_plan, name='delete-plan'),
    
    # Chat asistente
    path('chat-asistente/', views.chat_asistente, name='chat-asistente'),
    
    # Estadísticas y progreso
    path('user-stats/', views.user_stats, name='user_stats'),
    path('analisis-progreso/', views.analisis_progreso, name='analisis_progreso'),  # NUEVO - Análisis adaptativo
    
    # Rutina de hoy
    path('today-workout/', views.today_workout, name='today_workout'),
    
    # Completar ejercicios
    path('complete-exercise/', views.complete_exercise, name='complete_exercise'),
    path('completed-exercises/', views.completed_exercises, name='completed_exercises'),
    path('complete-workout/', views.complete_workout, name='complete_workout'),
    
    # Gestión de ejercicios (solo entrenadores)
    path('actualizar-ejercicio/<int:exercise_id>/', views.actualizar_ejercicio, name='actualizar_ejercicio'),
    
    # Rol de usuario
    path('user-role/', views.user_role, name='user_role'),
]