import logging

import requests
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _sender_address():
    """Dirección remitente a usar en la API HTTP."""
    return (
        getattr(settings, 'EMAIL_FROM_ADDRESS', '')
        or getattr(settings, 'EMAIL_HOST_USER', '')
        or 'no-reply@adaptafit.app'
    )


def enviar_email(destinatario, asunto, cuerpo):
    """Envía un correo y devuelve True si tuvo éxito, False si falló.

    Estrategia (en orden):
      1. Si existe BREVO_API_KEY, se usa la API HTTP de Brevo. Necesario en
         Render free, que bloquea las conexiones SMTP salientes.
      2. Si el backend es el de consola, no se envía nada real (solo log).
      3. En otro caso, SMTP con EMAIL_TIMEOUT para no quedarse colgado.
    """
    api_key = getattr(settings, 'BREVO_API_KEY', '')
    if api_key:
        try:
            resp = requests.post(
                'https://api.brevo.com/v3/smtp/email',
                headers={'api-key': api_key, 'Content-Type': 'application/json'},
                json={
                    'sender': {
                        'name': getattr(settings, 'EMAIL_FROM_NAME', 'AdaptaFit'),
                        'email': _sender_address(),
                    },
                    'to': [{'email': destinatario}],
                    'subject': asunto,
                    'textContent': cuerpo,
                },
                timeout=10,
            )
            if resp.status_code in (200, 201, 202):
                return True
            logger.warning(
                'Brevo rechazó el envío (%s): %s', resp.status_code, resp.text[:300]
            )
            return False
        except Exception as exc:  # noqa: BLE001
            logger.warning('Error enviando por Brevo: %s', exc)
            return False

    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        send_mail(
            asunto, cuerpo, settings.DEFAULT_FROM_EMAIL, [destinatario],
            fail_silently=True,
        )
        return True

    try:
        send_mail(
            asunto, cuerpo, settings.DEFAULT_FROM_EMAIL, [destinatario],
            fail_silently=False,
        )
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning('Error enviando por SMTP: %s', exc)
        return False
