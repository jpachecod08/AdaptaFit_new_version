"""
RF-20: Recordatorios de entrenamiento.

Crea una notificación in-app para los clientes con rutina activa que no han
completado una sesión en los últimos `--days` días (por defecto 3).

Pensado para ejecutarse a diario (por ejemplo, un cron en Render):
    python manage.py send_workout_reminders
    python manage.py send_workout_reminders --days 2
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from workouts.models import ClientAssignment, SessionLog, Notification


class Command(BaseCommand):
    help = 'Envía recordatorios de entrenamiento a clientes inactivos (RF-20).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days', type=int, default=3,
            help='Días de inactividad para considerar que hace falta recordatorio.',
        )

    def handle(self, *args, **options):
        days = options['days']
        threshold = timezone.now() - timedelta(days=days)
        hoy = timezone.localdate()

        enviados = 0
        for assignment in ClientAssignment.objects.filter(is_active=True).select_related('client'):
            last = SessionLog.objects.filter(
                assignment=assignment, is_completed=True
            ).order_by('-finished_at').first()
            last_at = last.finished_at if last else None

            if last_at and last_at > threshold:
                continue

            # Evita duplicar el recordatorio en el mismo día
            ya_hoy = Notification.objects.filter(
                recipient=assignment.client,
                type='workout_reminder',
                created_at__date=hoy,
            ).exists()
            if ya_hoy:
                continue

            Notification.objects.create(
                recipient=assignment.client,
                type='workout_reminder',
                title='¡Es hora de entrenar!',
                message='No registras entrenamientos hace unos días. ¡Retoma tu rutina!',
                link='/mi-rutina',
            )
            enviados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Recordatorios enviados: {enviados} (umbral {days} días).'
        ))
