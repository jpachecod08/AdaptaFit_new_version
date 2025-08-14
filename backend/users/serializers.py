from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from .models import UserProfile, TrainerProfile

# Importa el modelo de usuario personalizado
CustomUser = get_user_model()

# Serializador para el perfil de usuario.
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['fechaNacimiento', 'genero', 'altura', 'peso', 'objetivo', 'experiencia', 'frecuencia', 'lesiones']

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
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')  # Extraemos los datos del perfil
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(password=password, **validated_data)
        UserProfile.objects.create(user=user, **profile_data)  # Creamos perfil con los datos
        return user


# Serializador para el registro de entrenadores.
class TrainerRegisterSerializer(serializers.ModelSerializer):
    trainer_profile = TrainerProfileSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = ['id', 'nombre', 'email', 'password', 'role', 'trainer_profile']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

    def create(self, validated_data):
        trainer_profile_data = validated_data.pop('trainer_profile', {})
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(password=password, **validated_data)
        
        # Crea el perfil del entrenador
        TrainerProfile.objects.create(user=user, **trainer_profile_data)
        return user

# Serializador para el login (CORREGIDO)
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
            # Buscamos al usuario por su email
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                # Si no se encuentra el usuario, lanzamos un error de autenticación
                msg = _('No se puede iniciar sesión con las credenciales proporcionadas.')
                raise serializers.ValidationError(msg, code='authorization')

            # Verificamos la contraseña usando el método del modelo de usuario
            if not user.check_password(password):
                # Si la contraseña es incorrecta, lanzamos un error de autenticación
                msg = _('No se puede iniciar sesión con las credenciales proporcionadas.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Debe incluir "email" y "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs
    

# En tu archivo serializers.py

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