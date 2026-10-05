from django.conf import settings
from storages.backends.s3 import S3Storage


class SupabaseStorage(S3Storage):
    """S3Storage que devuelve URLs públicas de Supabase Storage.

    django-storages construye la URL a partir del endpoint S3, que en Supabase
    responde 403 sin firma. Como el bucket es público, la forma correcta es
    /storage/v1/object/public/<bucket>/<ruta>. No se usan URLs prefirmadas
    porque expirarían y las fotos dejarían de verse.
    """

    def url(self, name):
        return f'{settings.SUPABASE_PUBLIC_MEDIA_URL}{name}'