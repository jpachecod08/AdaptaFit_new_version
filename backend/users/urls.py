# users/urls.py - ARCHIVO CORREGIDO
from django.urls import path
from .views import (
    LoginView,
    UserRegisterView,
    TrainerRegisterView,
    UserProfileView,
    EntrenadorListView,
    user_role,
    password_reset_request,
    password_reset_verify,
    password_reset_confirm,
    change_password,
    update_profile,
    get_trainer_clients,
    get_client_details,
    update_client_plan,
    available_trainers,
    assign_trainer,
    remove_trainer,
    my_trainer,
    all_users_for_admin,
    admin_assign_trainer,
)

urlpatterns = [
    # Autenticación
    path('login/', LoginView.as_view(), name='login'),
    
    # Registro
    path('register/user/', UserRegisterView.as_view(), name='user-register'),
    path('register/trainer/', TrainerRegisterView.as_view(), name='trainer-register'),
    
    # Perfil y usuario
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('user-role/', user_role, name='user-role'),
    path('update-profile/', update_profile, name='update-profile'),
    
    # Restablecimiento de contraseña
    path('password-reset/', password_reset_request, name='password_reset_request'),
    path('password-reset/verify/', password_reset_verify, name='password_reset_verify'),
    path('password-reset/confirm/', password_reset_confirm, name='password_reset_confirm'),
    path('change-password/', change_password, name='change-password'),
    
    # Listados
    path('entrenadores/', EntrenadorListView.as_view(), name='entrenadores-list'),

    # ⭐⭐ NUEVAS RUTAS PARA ASIGNACIÓN DE ENTRENADORES ⭐⭐
    path('trainers/available/', available_trainers, name='available-trainers'),
    path('trainers/assign/', assign_trainer, name='assign-trainer'),
    path('trainers/remove/', remove_trainer, name='remove-trainer'),
    path('trainers/my-trainer/', my_trainer, name='my-trainer'),
    
    # Dashboard de entrenador
    path('trainer/clients/', get_trainer_clients, name='trainer-clients'),
    path('trainer/clients/<int:client_id>/', get_client_details, name='client-details'),
    path('trainer/clients/<int:client_id>/update-plan/', update_client_plan, name='update-client-plan'),
]