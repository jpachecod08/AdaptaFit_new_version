import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------
#       CONFIGURACIÓN BASE
# -----------------------------
SECRET_KEY = 'django-insecure-!x8@8f$8k^6#m&gv3b%2q#9t+7w!z5*yu2a@4$6r&n^c#1p(9s'

DEBUG = True

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
]

# -----------------------------
#         APLICACIONES
# -----------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceros
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',

    # Apps del proyecto
    'users',
    'workouts',
]

# -----------------------------
#  CONFIGURACIÓN DRF
# -----------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# -----------------------------
#       MIDDLEWARE
# -----------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # DEBE SER EL PRIMERO
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'adaptafit_backend.urls'

# -----------------------------
#        TEMPLATES (ADMIN)
# -----------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'adaptafit_backend.wsgi.application'

# -----------------------------
#   BASE DE DATOS LOCAL DESARROLLO
# -----------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'adaptafit_db',
        'USER': 'postgres',       # Usuario local (ajústalo si es otro)
        'PASSWORD': '1234',       # Contraseña local
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Si prefieres usar SQLite durante desarrollo, usa este en lugar del de arriba:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# -----------------------------
#        INTERNACIONALIZACIÓN
# -----------------------------
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'

USE_I18N = True
USE_TZ = True

# -----------------------------
#         ARCHIVOS ESTÁTICOS
# -----------------------------
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -----------------------------
#   CORS PARA DESARROLLO
# -----------------------------
CORS_ALLOW_ALL_ORIGINS = True

# -----------------------------
#     USUARIO PERSONALIZADO
# -----------------------------
AUTH_USER_MODEL = 'users.CustomUser'

# -----------------------------
#        SMTP (Opcional)
# -----------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'jpachecod@unicartagena.edu.co'
EMAIL_HOST_PASSWORD = 'xmek vldd scfn wulo'
DEFAULT_FROM_EMAIL = 'AdaptaFit <jpachecod@unicartagena.edu.co>'
