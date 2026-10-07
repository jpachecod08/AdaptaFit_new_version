# users/urls.py - ARCHIVO CORREGIDO
from django.urls import path
from .admin_api import (
    admin_users,
    admin_create_user,
    admin_update_user,
    admin_delete_user,
    admin_activity,
)
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
    all_users_for_trainer,
)

urlpatterns = [
    # ==================== PANEL DE ADMINISTRACIÓN (solo role=admin) =========
    path('admin/users/', admin_users, name='admin-users'),
    path('admin/users/create/', admin_create_user, name='admin-create-user'),
    path('admin/users/<int:user_id>/', admin_update_user, name='admin-update-user'),
    path('admin/users/<int:user_id>/delete/', admin_delete_user, name='admin-delete-user'),
    path('admin/activity/', admin_activity, name='admin-activity'),

    # Autenticación
    path('login/', LoginView.as_view(), name='login'),
    
    # Registro
    path('register/user/', UserRegisterView.as_view(), name='user-register'),
    # Solo un administrador puede crear entrenadores. El formulario público
    # ya no ofrece esta opción.
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
    path('trainer/all-users/', all_users_for_trainer, name='trainer-all-users'),
]