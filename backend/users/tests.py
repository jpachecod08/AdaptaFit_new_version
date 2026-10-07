"""Tests del panel de administración.

Cubren autorización, alta de entrenadores, alta/baja de cuentas, permiso de
administrador y auditoría. Corren contra la BD de prueba que Django crea solo
para el test (nunca tocan la de producción).
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import AdminAction, TrainerProfile, UserProfile

CustomUser = get_user_model()


class PanelAdminBase(TestCase):
    def setUp(self):
        self.client_api = APIClient()

        self.admin = CustomUser.objects.create_user(
            email='admin@test.com', password='Clave1234!', nombre='Admin',
            role='usuario', es_admin=True, is_staff=True)
        self.coach = CustomUser.objects.create_user(
            email='coach@test.com', password='Clave1234!', nombre='Coach',
            role='entrenador')
        TrainerProfile.objects.create(user=self.coach, especialidad='Fuerza')
        UserProfile.objects.create(user=self.coach)

        self.alumno = CustomUser.objects.create_user(
            email='alumno@test.com', password='Clave1234!', nombre='Alumno',
            role='usuario')
        UserProfile.objects.create(user=self.alumno)

        self.token_admin = Token.objects.create(user=self.admin)
        self.token_coach = Token.objects.create(user=self.coach)

    def auth(self, token):
        self.client_api.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def logout(self):
        self.client_api.credentials()

    # ----------------------------------------------------- autorización
    def test_listado_requiere_permiso_de_admin(self):
        self.auth(self.token_coach)
        r = self.client_api.get(reverse('admin-users'))
        self.assertEqual(r.status_code, 403)

        self.logout()
        r = self.client_api.get(reverse('admin-users'))
        self.assertEqual(r.status_code, 401)

        self.auth(self.token_admin)
        r = self.client_api.get(reverse('admin-users'))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['stats']['total'], CustomUser.objects.count())
        self.assertGreaterEqual(r.data['stats']['entrenadores'], 1)

    def test_un_usuario_normal_no_se_puede_dar_permisos(self):
        token_alumno = Token.objects.create(user=self.alumno)
        self.auth(token_alumno)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'es_admin': True}, format='json')
        self.assertEqual(r.status_code, 403)
        self.alumno.refresh_from_db()
        self.assertFalse(self.alumno.es_admin)

    def test_registro_de_entrenador_no_es_publico(self):
        self.logout()
        r = self.client_api.post(
            reverse('trainer-register'),
            {'nombre': 'X', 'email': 'x@test.com', 'password': 'Clave1234!'},
            format='json')
        self.assertIn(r.status_code, (401, 403))
        self.assertFalse(CustomUser.objects.filter(email='x@test.com').exists())

        self.auth(self.token_coach)
        r = self.client_api.post(
            reverse('trainer-register'),
            {'nombre': 'X', 'email': 'x@test.com', 'password': 'Clave1234!'},
            format='json')
        self.assertEqual(r.status_code, 403)

    # ----------------------------------------------------- alta de cuentas
    def test_crear_entrenador(self):
        self.auth(self.token_admin)
        r = self.client_api.post(reverse('admin-create-user'), {
            'nombre': 'Nuevo Coach', 'email': 'nuevo@test.com',
            'password': 'Clave1234!', 'role': 'entrenador',
            'especialidad': 'Movilidad',
        }, format='json')

        self.assertEqual(r.status_code, 201, r.data)
        nuevo = CustomUser.objects.get(email='nuevo@test.com')
        self.assertEqual(nuevo.role, 'entrenador')
        self.assertTrue(hasattr(nuevo, 'trainer_profile'))
        self.assertEqual(nuevo.trainer_profile.especialidad, 'Movilidad')
        self.assertTrue(
            AdminAction.objects.filter(action='create_trainer',
                                       target='nuevo@test.com').exists())

    def test_crear_entrenador_con_email_repetido(self):
        self.auth(self.token_admin)
        r = self.client_api.post(reverse('admin-create-user'), {
            'email': 'alumno@test.com', 'password': 'Clave1234!',
            'role': 'entrenador',
        }, format='json')
        self.assertEqual(r.status_code, 400)

    def test_no_puede_autoasignarse_entrenador_en_el_registro(self):
        self.logout()
        r = self.client_api.post(reverse('user-register'), {
            'nombre': 'Pícaro', 'email': 'picaro@test.com',
            'password': 'Clave1234!', 'role': 'entrenador',
            'profile': {'trainer': self.coach.id},
        }, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        creado = CustomUser.objects.get(email='picaro@test.com')
        self.assertEqual(creado.role, 'usuario')
        self.assertIsNone(creado.profile.trainer)

    # ----------------------------------------------------- alta y baja
    def test_desactivar_cuenta_mata_su_token(self):
        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'is_active': False}, format='json')
        self.assertEqual(r.status_code, 200)

        self.alumno.refresh_from_db()
        self.assertFalse(self.alumno.is_active)
        self.assertFalse(Token.objects.filter(user=self.alumno).exists())

        self.logout()
        r = self.client_api.post(reverse('login'), {
            'email': 'alumno@test.com', 'password': 'Clave1234!'}, format='json')
        self.assertNotEqual(r.status_code, 200)

        # y se puede reactivar
        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'is_active': True}, format='json')
        self.assertEqual(r.status_code, 200)
        self.alumno.refresh_from_db()
        self.assertTrue(self.alumno.is_active)

    def test_no_puede_desactivar_al_ultimo_admin(self):
        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.admin.id]),
            {'is_active': False}, format='json')
        self.assertEqual(r.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_cambiar_rol_de_entrenador_a_usuario(self):
        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.coach.id]),
            {'role': 'usuario'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.coach.refresh_from_db()
        self.assertEqual(self.coach.role, 'usuario')
        # el aviso avisa que sus clientes quedan sin entrenador
        self.assertTrue(
            AdminAction.objects.filter(action='set_role', target='coach@test.com').exists())

    # ----------------------------------------------------- permiso admin
    def test_otorgar_y_revocar_permiso_de_admin(self):
        self.auth(self.token_admin)

        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'es_admin': True}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.alumno.refresh_from_db()
        self.assertTrue(self.alumno.es_admin)
        self.assertEqual(self.alumno.role, 'usuario')  # el rol no cambia

        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'es_admin': False}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.alumno.refresh_from_db()
        self.assertFalse(self.alumno.es_admin)

    def test_no_puede_revocarse_los_permisos_a_si_mismo(self):
        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.admin.id]),
            {'es_admin': False}, format='json')
        self.assertEqual(r.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.es_admin)

    def test_no_dar_permisos_a_una_cuenta_desactivada(self):
        self.alumno.is_active = False
        self.alumno.save(update_fields=['is_active'])
        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'es_admin': True}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_un_solo_admin_no_puede_inutilizarse(self):
        """El único admin activo no puede desactivarse, degradarse ni borrarse."""
        self.auth(self.token_admin)

        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.admin.id]),
            {'is_active': False}, format='json')
        self.assertEqual(r.status_code, 400)

        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.admin.id]),
            {'es_admin': False}, format='json')
        self.assertEqual(r.status_code, 400)

        r = self.client_api.delete(reverse('admin-delete-user', args=[self.admin.id]))
        self.assertEqual(r.status_code, 400)

        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)
        self.assertTrue(self.admin.es_admin)
        self.assertTrue(CustomUser.objects.filter(pk=self.admin.pk).exists())

    def test_un_admin_ya_desactivado_no_sirve_de_respaldo(self):
        """Sin la cuenta desactivada como respaldo, no puede apagarse a sí mismo."""
        CustomUser.objects.create_user(
            email='baja@test.com', password='Clave1234!',
            es_admin=True, is_active=False)

        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.admin.id]),
            {'is_active': False}, format='json')
        self.assertEqual(r.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    # ----------------------------------------------------- contraseñas
    def test_resetear_password_cierra_sesiones(self):
        token_alumno = Token.objects.create(user=self.alumno)
        self.auth(self.token_admin)

        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'password': 'NuevaClave123'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertFalse(Token.objects.filter(user=self.alumno).exists())
        self.alumno.refresh_from_db()
        self.assertTrue(self.alumno.check_password('NuevaClave123'))
        self.assertFalse(self.alumno.check_password('Clave1234!'))
        self.assertTrue(
            AdminAction.objects.filter(action='reset_password',
                                       target='alumno@test.com').exists())
        self.assertFalse(Token.objects.filter(key=token_alumno.key).exists())

    def test_password_corta_rechazada(self):
        self.auth(self.token_admin)
        r = self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'password': '123'}, format='json')
        self.assertEqual(r.status_code, 400)

    # ----------------------------------------------------- borrado
    def test_no_puede_eliminar_su_propia_cuenta(self):
        self.auth(self.token_admin)
        r = self.client_api.delete(reverse('admin-delete-user', args=[self.admin.id]))
        self.assertEqual(r.status_code, 400)
        self.assertTrue(CustomUser.objects.filter(pk=self.admin.pk).exists())

    def test_eliminar_cuenta_y_dejar_rastro(self):
        self.auth(self.token_admin)
        r = self.client_api.delete(reverse('admin-delete-user', args=[self.alumno.id]))
        self.assertEqual(r.status_code, 200, r.data)
        self.assertFalse(CustomUser.objects.filter(pk=self.alumno.pk).exists())
        self.assertTrue(
            AdminAction.objects.filter(action='delete_user', target='alumno@test.com').exists())

    def test_no_puede_eliminar_cuentas_sin_permisos(self):
        self.auth(self.token_coach)
        r = self.client_api.delete(reverse('admin-delete-user', args=[self.alumno.id]))
        self.assertEqual(r.status_code, 403)
        self.assertTrue(CustomUser.objects.filter(pk=self.alumno.pk).exists())

    def test_eliminar_entrenador_sin_clientes(self):
        from workouts.models import RoutineTemplate

        RoutineTemplate.objects.create(trainer=self.coach, name='Rutina X')

        self.auth(self.token_admin)
        r = self.client_api.delete(reverse('admin-delete-user', args=[self.coach.id]))
        self.assertEqual(r.status_code, 200, r.data)
        self.assertFalse(CustomUser.objects.filter(pk=self.coach.pk).exists())

    def test_no_eliminar_entrenador_con_clientes(self):
        """PROTECT manda: hay que desactivarlo, no borrarlo en caliente."""
        from workouts.models import ClientAssignment, RoutineTemplate

        rutina = RoutineTemplate.objects.create(trainer=self.coach, name='Rutina X')
        ClientAssignment.objects.create(
            client=self.alumno, trainer=self.coach, routine=rutina)

        self.auth(self.token_admin)
        r = self.client_api.delete(reverse('admin-delete-user', args=[self.coach.id]))
        self.assertEqual(r.status_code, 409, r.data)
        self.assertIn('Desactívalo', r.data['error'])
        self.assertTrue(CustomUser.objects.filter(pk=self.coach.pk).exists())
        self.assertTrue(ClientAssignment.objects.filter(pk=rutina.assignments.first().pk).exists())

    def test_no_eliminar_si_su_rutina_sigue_usada_por_otro_entrenador(self):
        """La rutina con `PROTECT` bloquea el borrado y devuelve 409, no 500."""
        from workouts.models import ClientAssignment, RoutineTemplate

        rutina = RoutineTemplate.objects.create(trainer=self.coach, name='Compartida')
        otro = CustomUser.objects.create_user(
            email='otro@test.com', password='Clave1234!', role='entrenador')
        TrainerProfile.objects.create(user=otro, especialidad='Cardio')
        UserProfile.objects.create(user=otro)
        ClientAssignment.objects.create(client=self.alumno, trainer=otro, routine=rutina)

        self.auth(self.token_admin)
        r = self.client_api.delete(reverse('admin-delete-user', args=[self.coach.id]))
        self.assertEqual(r.status_code, 409, r.data)
        self.assertTrue(CustomUser.objects.filter(pk=self.coach.pk).exists())

    # ----------------------------------------------------- auditoría
    def test_historial_ordenado_y_visible_solo_para_admin(self):
        self.auth(self.token_admin)
        self.client_api.patch(
            reverse('admin-update-user', args=[self.alumno.id]),
            {'is_active': False}, format='json')

        r = self.client_api.get(reverse('admin-activity'))
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.data), 1)
        self.assertEqual(r.data[0]['actor'], 'admin@test.com')
        self.assertEqual(r.data[0]['action'], 'deactivate')

        self.auth(self.token_coach)
        self.assertEqual(
            self.client_api.get(reverse('admin-activity')).status_code, 403)

    def test_el_perfil_expone_el_permiso_de_admin(self):
        self.auth(self.token_admin)
        r = self.client_api.get(reverse('profile'))
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data['es_admin'])
        self.assertEqual(r.data['role'], 'usuario')
