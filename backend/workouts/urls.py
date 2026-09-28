# workouts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ==================== PLANES (IA / legacy) ====================
    path('plans/<int:plan_id>/', views.plan_detail, name='plan-detail'),
    path('plans/usuario/<int:user_id>/', views.plan_por_usuario, name='plan-por-usuario'),
    path('mis-planes/', views.mis_planes, name='mis_planes'),
    path('regenerar-plan/<int:user_id>/', views.regenerar_plan, name='regenerar_plan'),
    path('plans/<int:plan_id>/check-updates/', views.check_plan_updates, name='check-plan-updates'),
    path('delete-plan/<int:plan_id>/', views.delete_plan, name='delete-plan'),

    # ==================== CHAT ====================
    path('chat-asistente/', views.chat_asistente, name='chat-asistente'),

    # ==================== ESTADÍSTICAS ====================
    path('user-stats/', views.user_stats, name='user_stats'),
    path('analisis-progreso/', views.analisis_progreso, name='analisis_progreso'),

    # ==================== RUTINA DE HOY (legacy) ====================
    path('today-workout/', views.today_workout, name='today_workout'),
    path('complete-exercise/', views.complete_exercise, name='complete_exercise'),
    path('completed-exercises/', views.completed_exercises, name='completed_exercises'),
    path('complete-workout/', views.complete_workout, name='complete_workout'),
    path('actualizar-ejercicio/<int:exercise_id>/', views.actualizar_ejercicio, name='actualizar_ejercicio'),
    path('user-role/', views.user_role, name='user_role'),

    # ==================== 🆕 NUEVO ENFOQUE ====================

    # Exercise Templates (Entrenador)
    path('exercise-templates/', views.exercise_templates, name='exercise-templates'),
    path('exercise-templates/<int:pk>/', views.exercise_template_detail, name='exercise-template-detail'),

    # Routine Templates (Entrenador)
    path('routine-templates/', views.routine_templates, name='routine-templates'),
    path('routine-templates/<int:pk>/', views.routine_template_detail, name='routine-template-detail'),
    path('routine-templates/<int:pk>/add-session/', views.routine_add_session, name='routine-add-session'),
    path('routine-templates/<int:pk>/assign/', views.assign_routine, name='assign-routine'),

    # Session + Slots (Entrenador)
    path('session-templates/<int:pk>/', views.session_template_detail, name='session-template-detail'),
    path('session-templates/<int:pk>/add-slot/', views.session_add_slot, name='session-add-slot'),
    path('slots/<int:pk>/', views.slot_detail, name='slot-detail'),
    path('slots/<int:pk>/delete/', views.slot_delete, name='slot-delete'),

    # Cliente: Mi rutina y sesiones
    path('my-assignment/', views.my_assignment, name='my-assignment'),
    path('my-next-session/', views.my_next_session, name='my-next-session'),
    path('session-log/<int:session_log_id>/add-set/', views.add_set, name='add-set'),
    path('session-log/<int:session_log_id>/finish/', views.finish_session, name='finish-session'),
    path('apply-progression/<int:slot_id>/', views.apply_progression, name='apply-progression'),
    path('my-progress/', views.my_progress, name='my-progress'),

    # Entrenador: progreso de un cliente
    path('clients/<int:client_id>/progress/', views.client_progress_detail, name='client-progress-detail'),
]