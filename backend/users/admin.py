from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import AdminAction, CustomUser, TrainerProfile, UserProfile


@admin.register(CustomUser)
class CustomUserAdmin(DjangoUserAdmin):
    """Panel clásico de Django para usuarios, sin el campo username."""

    ordering = ('email',)
    list_display = ('email', 'nombre', 'role', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'nombre')
    # AbstractUser trae username=None y el USER_NAME_FIELD es el email.
    fieldsets = (
        (None, {'fields': ('email', 'nombre', 'password')}),
        ('Permisos', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser',
                                 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',),
                'fields': ('email', 'nombre', 'password1', 'password2',
                           'role', 'is_active', 'is_staff')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'objetivo', 'frecuencia', 'trainer')
    search_fields = ('user__email', 'user__nombre')
    list_filter = ('objetivo',)


@admin.register(TrainerProfile)
class TrainerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'especialidad', 'anosExperiencia', 'telefono')
    search_fields = ('user__email', 'user__nombre', 'especialidad')


@admin.register(AdminAction)
class AdminActionAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'actor_email', 'action', 'target')
    list_filter = ('action',)
    search_fields = ('actor_email', 'target')
    readonly_fields = ('actor', 'actor_email', 'action', 'target', 'target_id',
                       'detail', 'created_at')

    def has_add_permission(self, request):
        return False  # el historial solo se escribe desde la API

    def has_change_permission(self, request, obj=None):
        return False
