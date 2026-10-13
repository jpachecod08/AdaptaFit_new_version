"""Diagnostica el envío de correo (útil en producción, p. ej. Render).

Muestra qué transporte está configurado (Brevo API HTTP, SMTP o consola) y
hace un envío de prueba para ver el resultado o el error exacto.

Uso:
    python manage.py send_test_email tu@email.com

En producción (Render, pestaña Shell):
    cd backend && python manage.py send_test_email tu@email.com
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from users.email_utils import enviar_email, _sender_address


class Command(BaseCommand):
    help = 'Envía un correo de prueba y muestra el transporte usado y el resultado.'

    def add_arguments(self, parser):
        parser.add_argument('destinatario', nargs='?', help='Correo de destino de la prueba.')
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo muestra la configuración, sin enviar.',
        )

    def handle(self, *args, **options):
        brevo = getattr(settings, 'BREVO_API_KEY', '')
        backend = settings.EMAIL_BACKEND

        if brevo:
            transporte = 'Brevo (API HTTP)'
            clave = f'{brevo[:8]}...{brevo[-4:]}' if len(brevo) > 12 else '(corta)'
        elif backend == 'django.core.mail.backends.console.EmailBackend':
            transporte = 'Consola (no envía de verdad)'
            clave = '(no aplica)'
        else:
            transporte = 'SMTP'
            clave = '(no aplica)'

        self.stdout.write('--- Configuración de correo ---')
        self.stdout.write(f'  Transporte        : {transporte}')
        self.stdout.write(f'  BREVO_API_KEY     : {"SI" if brevo else "NO"} {clave if brevo else ""}')
        self.stdout.write(f'  EMAIL_BACKEND     : {backend}')
        self.stdout.write(f'  EMAIL_HOST        : {getattr(settings, "EMAIL_HOST", "-")}')
        self.stdout.write(f'  EMAIL_PORT        : {getattr(settings, "EMAIL_PORT", "-")}')
        self.stdout.write(f'  EMAIL_TIMEOUT     : {getattr(settings, "EMAIL_TIMEOUT", "-")}')
        self.stdout.write(f'  EMAIL_FROM_ADDRESS: "{getattr(settings, "EMAIL_FROM_ADDRESS", "")}"')
        self.stdout.write(f'  Remitente efectivo: "{_sender_address()}"')
        self.stdout.write(f'  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')

        destinatario = options.get('destinatario')
        if options.get('dry_run') or not destinatario:
            if not destinatario and not options.get('dry_run'):
                self.stdout.write(self.style.WARNING(
                    '\nNo diste destinatario; no se envía nada. '
                    'Usa: python manage.py send_test_email tu@email.com'))
            return

        self.stdout.write(f'\nEnviando prueba a {destinatario} ...')
        ok = enviar_email(
            destinatario,
            'Prueba de correo - AdaptaFit',
            'Si recibes este mensaje, el envío de correo funciona correctamente.',
        )
        if ok:
            self.stdout.write(self.style.SUCCESS('Envío correcto (True).'))
        else:
            self.stdout.write(self.style.ERROR(
                'El envío falló (False). Revisa los warnings anteriores en los logs.'))
            raise CommandError('Fallo el envío de prueba.')
