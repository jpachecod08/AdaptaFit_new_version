# --- Archivo: users/urls.py ---
from django.urls import path
from .views import UserRegisterView, TrainerRegisterView, LoginView, UserProfileView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/user/', UserRegisterView.as_view(), name='user-register'),
    path('register/trainer/', TrainerRegisterView.as_view(), name='trainer-register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
]
