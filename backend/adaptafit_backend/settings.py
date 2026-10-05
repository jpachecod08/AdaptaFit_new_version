import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------
#       CONFIGURACIÓN BASE
# -----------------------------
# DEBUG se activa SOLO si DJANGO_DEBUG vale true/1/yes/on.
# Por defecto es False a proposito: con DEBUG=True, Django publica la pagina de
# error con TODA la configuracion (incluida la contrasena de la base de datos)
# en un endpoint publico. En produccion nunca debe quedar activo.
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').strip().lower() in ('true', '1', 'yes', 'on')

# SECRET_KEY desde variable de entorno. En produccion es OBLIGATORIO definirlo.
# El fallback versionado solo es aceptable con DEBUG=True (desarrollo local).
_INSECURE_SECRET_KEY = 'django-insecure-!x8@8f$8k^6#m&gv3b%2q#9t+7w!z5*yu2a@4$6r&n^c#1p(9s'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '') or _INSECURE_SECRET_KEY
if not DEBUG and SECRET_KEY == _INSECURE_SECRET_KEY:
    # No usamos la clave insegura del repo en produccion. Generamos una
    # aleatoria para este proceso en vez de fallar el arranque: la API usa
    # autenticacion por token, no sesiones, asi que no se pierde funcionalidad.
    SECRET_KEY = secrets.token_urlsafe(64)

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
    'whitenoise.middleware.WhiteNoiseMiddleware',  # sirve /static/ con DEBUG=False
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


MEDIA_URL = '/media/'
# MEDIA_ROOT configurable por entorno: solo se usa con almacenamiento local.
# En Render el disco es efimero (las fotos se pierden en cada redespliegue),
# por eso en produccion lo normal es usar Supabase Storage (ver STORAGES abajo).
MEDIA_ROOT = os.environ.get('MEDIA_ROOT') or os.path.join(BASE_DIR, 'media')
# Si prefieres usar SQLite durante desarrollo, usa este en lugar del de arriba:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# -----------------------------
#   ALMACENAMIENTO DE ARCHIVOS
# -----------------------------
# Con Supabase Storage (endpoint compatible con S3) las fotos sobreviven a los
# redespliegues de Render. Se activa solo si estan las 4 variables necesarias;
# si falta alguna, se sigue usando el almacenamiento local en disco.
_SUPABASE_REF = os.environ.get('SUPABASE_PROJECT_REF', '').strip()
_SUPABASE_BUCKET = os.environ.get('SUPABASE_S3_BUCKET', '').strip()
_SUPABASE_ENDPOINT = os.environ.get('SUPABASE_S3_ENDPOINT', '').strip() or (
    f'https://{_SUPABASE_REF}.storage.supabase.co/storage/v1/s3' if _SUPABASE_REF else ''
)
_SUPABASE_REGION = os.environ.get('SUPABASE_S3_REGION', 'us-west-2').strip()
_SUPABASE_ACCESS_KEY = os.environ.get('SUPABASE_S3_ACCESS_KEY', '').strip()
_SUPABASE_SECRET_KEY = os.environ.get('SUPABASE_S3_SECRET_KEY', '').strip()

if _SUPABASE_BUCKET and _SUPABASE_ENDPOINT and _SUPABASE_ACCESS_KEY and _SUPABASE_SECRET_KEY:
    # URL publica del bucket: es la unica que responde sin firma. El frontend
    # la usa tal cual porque ya detecta URLs absolutas.
    SUPABASE_PUBLIC_MEDIA_URL = (
        f'https://{_SUPABASE_REF}.supabase.co/storage/v1/object/public/{_SUPABASE_BUCKET}/'
    )
    STORAGES = {
        'default': {
            'BACKEND': 'adaptafit_backend.storage.SupabaseStorage',
            'OPTIONS': {
                'bucket_name': _SUPABASE_BUCKET,
                'access_key': _SUPABASE_ACCESS_KEY,
                'secret_key': _SUPABASE_SECRET_KEY,
                'region_name': _SUPABASE_REGION,
                'endpoint_url': _SUPABASE_ENDPOINT,
                'addressing_style': 'path',
                'querystring_auth': False,
                'default_acl': None,
                'file_overwrite': False,
                'max_memory_size': 2621440,
            },
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
    MEDIA_URL = SUPABASE_PUBLIC_MEDIA_URL

# -----------------------------
#   HTTPS Y COOKIES (producción)
# -----------------------------
# Render termina TLS y reenvía por HTTP interno usando X-Forwarded-Proto.
# Sin esto Django creería que la petición no es segura y el SSL_REDIRECT
# entraría en bucle de redirecciones.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# Escape hatch: DJANGO_FORCE_HTTPS=False desactiva la redirección si el proxy
# de tu hosting no envía la cabecera anterior.
SECURE_SSL_REDIRECT = (
    not DEBUG and os.environ.get('DJANGO_FORCE_HTTPS', 'True').strip().lower() in ('true', '1', 'yes', 'on')
)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # el admin de Django necesita leerlo desde JS
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True

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
# En desarrollo whitenoise busca los archivos sin necesidad de collectstatic.
WHITENOISE_USE_FINDERS = DEBUG
WHITENOISE_AUTOREFRESH = DEBUG

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
    'https://adaptafit.netlify.app',
    'https://helpful-jalebi-63025e.netlify.app',
]
_cors_env = os.environ.get('DJANGO_CORS_ORIGINS', '')
if _cors_env:
    _CORS_DEFAULT.extend([o.strip() for o in _cors_env.split(',') if o.strip()])
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(_CORS_DEFAULT))
# Cualquier subdominio de netlify.app queda permitido (nombre generado por Netlify)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://[a-z0-9-]+\.netlify\.app$',
]
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
