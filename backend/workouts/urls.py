from django.urls import path
from .views import generar_rutina_con_gemini, plan_detail,plan_por_usuario,chat_asistente

urlpatterns = [
    path('generar-rutina/', generar_rutina_con_gemini, name='generar-rutina'),
    path('plans/<int:plan_id>/', plan_detail, name='plan-detail'),
    path('plans/usuario/<int:user_id>/', plan_por_usuario, name='plan-por-usuario'),
    path('chat-asistente/', chat_asistente, name='chat-asistente'),
]
