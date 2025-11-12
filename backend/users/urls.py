# --- Archivo: users/urls.py ---
from django.urls import path
from .views import UserRegisterView, TrainerRegisterView, LoginView, UserProfileView,EntrenadorListView,password_reset_request,password_reset_verify,password_reset_confirm

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/user/', UserRegisterView.as_view(), name='user-register'),
    path('register/trainer/', TrainerRegisterView.as_view(), name='trainer-register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('entrenadores/', EntrenadorListView.as_view(), name='entrenadores-list'),
    path('password-reset/', password_reset_request, name='password_reset_request'),
    path('password-reset/verify/', password_reset_verify, name='password_reset_verify'),
    path('password-reset/confirm/', password_reset_confirm, name='password_reset_confirm'),
    
]
