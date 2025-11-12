"""
URL configuration for adaptafit_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from users.views import LoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/login/', LoginView.as_view(), name='api_token_auth'),
    path('api/users/', include('users.urls')),   # Aquí usuarios con subruta /api/users/
    path('api/workouts/', include('workouts.urls')),  # Rutinas en /api/workouts/
]

