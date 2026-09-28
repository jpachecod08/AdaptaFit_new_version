"""
URL configuration for adaptafit_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings                    # ← FALTA
from django.conf.urls.static import static          # ← FALTA
from rest_framework.authtoken.views import obtain_auth_token
from users.views import LoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LoginView.as_view(), name='api_token_auth'),
    path('api/users/', include('users.urls')),
    path('api/workouts/', include('workouts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)