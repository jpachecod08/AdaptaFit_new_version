# workouts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generar-rutina/', views.generar_rutina_con_gemini, name='generar-rutina'),
    path('plans/<int:plan_id>/', views.plan_detail, name='plan-detail'),
    path('plans/usuario/<int:user_id>/', views.plan_por_usuario, name='plan-por-usuario'),
    path('chat-asistente/', views.chat_asistente, name='chat-asistente'),
    path('user-stats/', views.user_stats, name='user_stats'),
    path('today-workout/', views.today_workout, name='today_workout'),
    path('complete-exercise/', views.complete_exercise, name='complete_exercise'),
    path('completed-exercises/', views.completed_exercises, name='completed_exercises'),
    path('complete-workout/', views.complete_workout, name='complete_workout'),
    path('mis-planes/', views.mis_planes, name='mis_planes'),
    path('regenerar-plan/<int:user_id>/', views.regenerar_plan, name='regenerar_plan'),
]