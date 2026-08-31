import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------
#       CONFIGURACIÓN BASE
# -----------------------------
# SECRET_KEY desde variable de entorno. En producción es OBLIGATORIO definirlo.
# El fallback solo es seguro para desarrollo local (DEBUG=True).
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-!x8@8f$8k^6#m&gv3b%2q#9t+7w!z5*yu2a@4$6r&n^c#1p(9s'
)

# DEBUG se activa solo si no se define DJANGO_DEBUG o si es 'True'
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

# Hosts permitidos: siempre localhost/127.0.0.1, más los definidos en ALLOWED_HOSTS (coma-separados)
_DEFAULT_HOSTS = ['localhost', '127.0.0.1', '.localhost', '.onrender.com', '.netlify.app']
_allowed_env = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
if _allowed_env:
    _DEFAULT_HOSTS.extend([h.strip() for h in _allowed_env.split(',') if h.strip()])
ALLOWED_HOSTS = list(dict.fromkeys(_DEFAULT_HOSTS))  # elimina duplicados conservando orden

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
#   BASE DE DATOS (configurable por entorno)
# -----------------------------
# En producción define DATABASE_URL o las variables DB_* individuales.
# Si DATABASE_URL existe (formato postgres://user:pass@host:port/db), se usa directamente.
DATABASE_URL = os.environ.get('DATABASE_URL', '')

if DATABASE_URL:
    import dj_database_url
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'adaptafit_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', '1234'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
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
#   CORS: orígenes permitidos (desarrollo + producción)
# -----------------------------
# En producción define DJANGO_CORS_ORIGINS con las URLs de tu frontend separadas por coma.
_CORS_DEFAULT = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://*.netlify.app',
    'https://adaptafit.netlify.app',
]
_cors_env = os.environ.get('DJANGO_CORS_ORIGINS', '')
if _cors_env:
    _CORS_DEFAULT.extend([o.strip() for o in _cors_env.split(',') if o.strip()])
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(_CORS_DEFAULT))
CORS_ALLOW_CREDENTIALS = True

# -----------------------------
#     USUARIO PERSONALIZADO
# -----------------------------
AUTH_USER_MODEL = 'users.CustomUser'

# -----------------------------
#        SMTP (configurable por entorno)
# -----------------------------
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
if EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
    EMAIL_HOST_USER = ''
    DEFAULT_FROM_EMAIL = 'AdaptaFit <no-reply@adaptafit.app>'
else:
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'jpachecod@unicartagena.edu.co')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
    DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'AdaptaFit <jpachecod@unicartagena.edu.co>')
