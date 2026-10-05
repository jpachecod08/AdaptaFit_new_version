"""
URL configuration for adaptafit_backend project.
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

from users.views import LoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LoginView.as_view(), name='api_token_auth'),
    path('api/users/', include('users.urls')),
    path('api/workouts/', include('workouts.urls')),
]

# Archivos subidos por el usuario (fotos de maquinas de exercises/).
# django.conf.urls.static.static() solo devuelve patrones cuando DEBUG=True,
# asi que se registra el patron explicitamente para que las fotos se sirvan
# tanto en desarrollo como en produccion. Valido para un gym de tamano pequeno
# (pocas fotos, trafico bajo). Si el proyecto crece, mover a Cloudinary/S3.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]