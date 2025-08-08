# users/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView # <-- Importa APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate # <-- Necesario para el serializador
from rest_framework.settings import api_settings

from .serializers import CustomUserSerializer, TrainerRegisterSerializer, AuthTokenSerializer


User = get_user_model()

# ----------------------------------------------------------------------
# VISTA DE LOGIN CORREGIDA
# ----------------------------------------------------------------------
class LoginView(APIView):
    """
    Vista para el login. Utiliza el serializador AuthTokenSerializer para validar
    credenciales y devuelve un token de autenticación junto con los datos del usuario.
    """
    permission_classes = [AllowAny]
    serializer_class = AuthTokenSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'tipo_usuario': user.role,
        }, status=status.HTTP_200_OK)


# ----------------------------------------------------------------------
# EL RESTO DE TUS VISTAS PERMANECEN IGUAL
# ----------------------------------------------------------------------
class UserRegisterView(generics.CreateAPIView):
    """
    Vista para registrar un nuevo usuario normal.
    """
    permission_classes = [AllowAny] 
    serializer_class = CustomUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "¡Registro de usuario exitoso! Por favor, inicia sesión.", "user": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class TrainerRegisterView(generics.CreateAPIView):
    """
    Vista para registrar un nuevo entrenador.
    """
    permission_classes = [AllowAny]
    serializer_class = TrainerRegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "¡Registro de entrenador exitoso! Por favor, inicia sesión.", "user": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class UserProfileView(APIView):
    """
    Vista para obtener el perfil del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = CustomUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)