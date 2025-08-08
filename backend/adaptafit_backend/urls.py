"""
URL configuration for adaptafit_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    # Incluye las URLs del panel de administración
    path('admin/', admin.site.urls),
    
    # Incluye las URLs de la API de la aplicación 'users'.
    # Todas las URLs de 'users' comenzarán con '/api/'.
    path('api/login/', obtain_auth_token, name='api_token_auth'),
    path('api/', include('users.urls')),
]
