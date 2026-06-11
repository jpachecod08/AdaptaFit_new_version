from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import secrets

# ---------- MANAGER ----------
class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email debe ser proporcionado')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True')

        return self.create_user(email, password, **extra_fields)

# ---------- CUSTOM USER ----------
class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, default='usuario')
    nombre = models.CharField(max_length=150, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

# ---------- USER PROFILE ----------
class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    fechaNacimiento = models.DateField(null=True, blank=True)
    genero = models.CharField(max_length=20, null=True, blank=True)
    altura = models.IntegerField(null=True, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    objetivo = models.CharField(max_length=50, null=True, blank=True)
    experiencia = models.CharField(max_length=50, null=True, blank=True)
    frecuencia = models.IntegerField(null=True, blank=True)
    lesiones = models.TextField(null=True, blank=True)

    TRAINING_TYPES = [
        ('gym', 'Gimnasio (pesas/máquinas)'),
        ('calisthenics', 'Calistenia (peso corporal)'),
        ('cardio', 'Aeróbico (correr, nadar, bici)'),
        ('yoga', 'Yoga / Pilates'),
        ('mixed', 'Mixto (combinado)'),
    ]
    training_type = models.CharField(
        max_length=20, 
        choices=TRAINING_TYPES, 
        default='calisthenics',
        blank=False,
        verbose_name='Tipo de entrenamiento preferido'
    )

    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='clients_as_trainer',
        verbose_name='Entrenador asignado'
    )

    def __str__(self):
        return f'Perfil de {self.user.email}'

# ---------- TRAINER PROFILE ----------
class TrainerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trainer_profile')
    especialidad = models.CharField(max_length=100)
    anosExperiencia = models.IntegerField(null=True, blank=True)
    certificaciones = models.TextField(null=True, blank=True)
    biografia = models.TextField(null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f'Perfil de entrenador de {self.user.email}'
    
# ---------- PASSWORD RESET CODE ----------
class PasswordResetCode(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    user_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'password_reset_codes'
    
    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=15)
    
    @classmethod
    def generate_code(cls, email, user_id):
        # Eliminar códigos existentes para este email
        cls.objects.filter(email=email).delete()
        
        # Generar nuevo código
        code = ''.join(secrets.choice('0123456789') for _ in range(6))
        
        # Crear nuevo registro
        return cls.objects.create(
            email=email,
            code=code,
            user_id=user_id
        )
    
    @classmethod
    def get_valid_code(cls, email, code):
        try:
            reset_code = cls.objects.get(email=email, code=code)
            if not reset_code.is_expired():
                return reset_code
            # Eliminar si está expirado
            reset_code.delete()
        except cls.DoesNotExist:
            pass
        return None