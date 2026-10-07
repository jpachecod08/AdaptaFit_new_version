"""Convierte una cuenta en administradora del panel.

No cambia el rol (usuario/entrenador), solo otorga el permiso `es_admin`,
asi la cuenta conserva su propio dashboard.

Uso:
    python manage.py make_admin david@example.com
    python manage.py make_admin david@example.com --revocar

En producción (Render, pestaña Shell):
    python manage.py make_admin tu@email.com
"""
from django.core.management.base import BaseCommand, CommandError

from users.models import CustomUser


class Command(BaseCommand):
    help = 'Otorga o revoca los permisos de administrador de una cuenta.'

    def add_arguments(self, parser):
        parser.add_argument('email', help='Correo de la cuenta a modificar.')
        parser.add_argument(
            '--revocar',
            action='store_true',
            help='Quita el permiso de administrador en lugar de otorgarlo.',
        )

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        revocar = options['revocar']

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise CommandError(f'No existe ninguna cuenta con el correo {email}.')

        if revocar:
            if user.is_admin:
                from django.db.models import Q
                otros = CustomUser.objects.filter(
                    Q(es_admin=True) | Q(role='admin')
                    | Q(is_staff=True) | Q(is_superuser=True)
                ).exclude(pk=user.pk).exists()
                if not otros:
                    raise CommandError(
                        'Es el único administrador; no se le pueden quitar los permisos.')
            user.es_admin = False
            user.is_staff = False
            if user.role == 'admin':
                user.role = 'usuario'
            user.save(update_fields=['es_admin', 'is_staff', 'role'])
            self.stdout.write(self.style.WARNING(f'{email} dejó de ser administrador.'))
            return

        user.es_admin = True
        user.is_staff = True
        user.is_active = True
        user.save(update_fields=['es_admin', 'is_staff', 'is_active'])

        self.stdout.write(self.style.SUCCESS(
            f'{email} ahora tiene permisos de administrador (rol {user.role}). '
            'Puede entrar a /admin desde su dashboard.'))
