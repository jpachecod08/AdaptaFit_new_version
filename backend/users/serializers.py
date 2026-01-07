from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from .models import UserProfile, TrainerProfile

# Importa el modelo de usuario personalizado
CustomUser = get_user_model()

# Serializador para el perfil de usuario.
class UserProfileSerializer(serializers.ModelSerializer):
    trainer_info = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'fechaNacimiento', 
            'genero', 
            'altura', 
            'peso', 
            'objetivo', 
            'experiencia', 
            'frecuencia', 
            'lesiones',
            'trainer',  # ← Agrega este campo
            'trainer_info'  # ← Campo adicional para información del entrenador
        ]
        read_only_fields = ['trainer_info']
    
    def get_trainer_info(self, obj):
        """Devuelve información estructurada del entrenador"""
        if obj.trainer:
            return {
                'id': obj.trainer.id,
                'name': obj.trainer.nombre or obj.trainer.email.split('@')[0],
                'email': obj.trainer.email,
                'role': obj.trainer.role,
                'has_trainer_profile': hasattr(obj.trainer, 'trainer_profile')
            }
        return None

# Serializador para el perfil de entrenador.
class TrainerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerProfile
        fields = ['especialidad', 'anosExperiencia', 'certificaciones', 'biografia', 'telefono']

# Serializador para el registro de usuarios normales.
class CustomUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=True)  # Ya no read_only

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'nombre',
            'email',
            'password',
            'role',
            'profile',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'read_only': True}
        }

    def validate_email(self, value):
        # Excluir el usuario actual al validar el email (para updates)
        if self.instance and CustomUser.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        elif not self.instance and CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(password=password, **validated_data)
        
        # Extraer trainer del profile_data si existe
        trainer = profile_data.pop('trainer', None) if 'trainer' in profile_data else None
        
        # Crear perfil
        UserProfile.objects.create(user=user, **profile_data)
        
        # Si se pasó un trainer, asignarlo
        if trainer:
            user.profile.trainer = trainer
            user.profile.save()
            
        return user

    def update(self, instance, validated_data):
        # Manejar datos del profile anidado
        profile_data = validated_data.pop('profile', None)
        
        # Actualizar campos básicos del usuario
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.email = validated_data.get('email', instance.email)
        
        # Manejar contraseña si se proporciona
        password = validated_data.get('password')
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Actualizar profile si existe
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            
            # Manejar asignación/remoción de entrenador
            trainer = profile_data.pop('trainer', None)
            if trainer is not None:  # Puede ser None para remover entrenador
                profile.trainer = trainer
            
            # Actualizar otros campos del perfil
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            
            profile.save()
        
        return instance

class TrainerRegisterSerializer(serializers.ModelSerializer):
    trainer_profile = TrainerProfileSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = ['id', 'nombre', 'email', 'password', 'role', 'trainer_profile']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'read_only': False}  # ← Permitir escritura durante el registro
        }
    
    def validate(self, data):
        # Forzar el rol como entrenador durante el registro
        data['role'] = 'entrenador'
        return data

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

    def create(self, validated_data):
        trainer_profile_data = validated_data.pop('trainer_profile', {})
        password = validated_data.pop('password')
    
        # Asegurar que se cree como entrenador
        # validated_data ya contiene 'role' = 'entrenador' del método validate()
        user = CustomUser.objects.create_user(
            password=password,
            **validated_data  # ← validated_data ya incluye role='entrenador'
        )
    
        # Crea el perfil del entrenador
        TrainerProfile.objects.create(user=user, **trainer_profile_data)
        return user
    
class AuthTokenSerializer(serializers.Serializer):
    email = serializers.EmailField(label=_("Email"), write_only=True)
    password = serializers.CharField(
        label=_("Password"),
        style={'input_type': 'password'},
        trim_whitespace=False,
        write_only=True
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Normalizar email
            email = email.lower().strip()
            
            # Buscar usuario por email directamente
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                msg = _('No se puede iniciar sesión con las credenciales proporcionadas.')
                raise serializers.ValidationError(msg, code='authorization')

            # Verificar si el usuario está activo
            if not user.is_active:
                msg = _('Esta cuenta está desactivada.')
                raise serializers.ValidationError(msg, code='authorization')

            # Verificar contraseña usando check_password
            if not user.check_password(password):
                msg = _('No se puede iniciar sesión con las credenciales proporcionadas.')
                raise serializers.ValidationError(msg, code='authorization')
                
            # Intentar authenticate también como respaldo
            user_auth = authenticate(username=email, password=password)
            if not user_auth:
                # Si authenticate falla pero check_password pasa, usar el usuario encontrado
                print(f"[AUTH] authenticate falló para {email}, pero check_password pasó")
            else:
                user = user_auth
                
        else:
            msg = _('Debe incluir "email" y "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs
# En tu archivo serializers.py

class EntrenadorListSerializer(serializers.ModelSerializer):
    trainer_profile = TrainerProfileSerializer()
    nombre_completo = serializers.SerializerMethodField()
    rating_promedio = serializers.SerializerMethodField()
    # Nuevos campos para las estadísticas
    clientes_total = serializers.SerializerMethodField()
    sesiones_completadas = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'nombre_completo',
            'email',
            'date_joined',
            'trainer_profile',
            'rating_promedio',
            'clientes_total',
            'sesiones_completadas',
        ]

    def get_nombre_completo(self, obj):
        return obj.nombre if obj.nombre else obj.email.split('@')[0]

    def get_rating_promedio(self, obj):
        # Valor estático de ejemplo
        return 4.5

    def get_clientes_total(self, obj):
        # Valor estático de ejemplo
        return 25

    def get_sesiones_completadas(self, obj):
        # Valor estático de ejemplo
        return 350
    
class AvailableTrainerSerializer(serializers.ModelSerializer):
    """Serializador para listar entrenadores disponibles"""
    specialization = serializers.CharField(source='trainer_profile.especialidad', allow_null=True)
    experience_years = serializers.IntegerField(source='trainer_profile.anosExperiencia', allow_null=True)
    certifications = serializers.CharField(source='trainer_profile.certificaciones', allow_null=True)
    bio = serializers.CharField(source='trainer_profile.biografia', allow_null=True)
    phone = serializers.CharField(source='trainer_profile.telefono', allow_null=True)
    clients_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'email',
            'nombre',
            'specialization',
            'experience_years',
            'certifications',
            'bio',
            'phone',
            'clients_count',
            'date_joined'
        ]
    
    def get_clients_count(self, obj):
        """Obtiene el número de clientes asignados a este entrenador"""
        return UserProfile.objects.filter(trainer=obj).count()
    
class AssignTrainerSerializer(serializers.Serializer):
    """Serializador para asignar/remover entrenador"""
    trainer_id = serializers.IntegerField(required=True)
    
    def validate_trainer_id(self, value):
        # Verificar que el entrenador existe y tiene el rol correcto
        try:
            trainer = CustomUser.objects.get(id=value, role='entrenador')
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Entrenador no encontrado")
        
        # Verificar que el entrenador tenga perfil de entrenador
        if not hasattr(trainer, 'trainer_profile'):
            raise serializers.ValidationError("Este usuario no tiene perfil de entrenador")
        
        return value
    
class AssignedTrainerSerializer(serializers.ModelSerializer):
    """Serializador para información del entrenador asignado"""
    trainer_profile = TrainerProfileSerializer(source='trainer.trainer_profile', read_only=True)
    trainer_name = serializers.CharField(source='trainer.nombre', read_only=True)
    trainer_email = serializers.EmailField(source='trainer.email', read_only=True)
    trainer_id = serializers.IntegerField(source='trainer.id', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'trainer_id',
            'trainer_name',
            'trainer_email',
            'trainer_profile'
        ]