# workouts/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


# ============================================================
# MODELOS BASE (existentes)
# ============================================================

class Exercise(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    equipment = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    difficulty = models.IntegerField(null=True, blank=True)
    video_url = models.URLField(blank=True)
    video_query = models.CharField(max_length=300, blank=True)

    def __str__(self):
        return self.name


class WorkoutPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workout_plans')
    title = models.CharField(max_length=200, default='Rutina personalizada')
    generated_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=50, default='rules+llm')
    notes = models.TextField(blank=True)
    last_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.title} - {self.user.email}'


class WorkoutDay(models.Model):
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='workout_days')
    day_index = models.IntegerField()
    name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'{self.plan.title} - {self.name or self.day_index}'


class WorkoutExercise(models.Model):
    day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='workout_exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=200)
    sets = models.IntegerField(null=True, blank=True)
    reps = models.CharField(max_length=50, null=True, blank=True)
    rest_seconds = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.name} ({self.day})'


class WorkoutHistory(models.Model):
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='history')
    day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    rpe = models.IntegerField(null=True, blank=True)
    comments = models.TextField(blank=True)


class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    exercise = models.ForeignKey('Exercise', on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'exercise']

    def __str__(self):
        return f"{self.user.email} - {self.exercise.name} - {self.completed}"


# ============================================================
# NUEVO ENFOQUE: Gestión manual de rutinas + progresión asistida
# ============================================================

class ExerciseTemplate(models.Model):
    """Ejercicio reutilizable creado por el entrenador."""
    INCREMENT_TYPES = [
        ('plate', 'Placa de máquina (sumar placas)'),
        ('kg_2_5', 'Peso libre (+2.5 kg)'),
        ('kg_5', 'Peso libre (+5 kg)'),
        ('bodyweight', 'Peso corporal (sin incremento)'),
        ('custom', 'Personalizado'),
    ]
    MUSCLE_GROUPS = [
        ('pecho', 'Pecho'), ('espalda', 'Espalda'), ('piernas', 'Piernas'),
        ('hombros', 'Hombros'), ('biceps', 'Bíceps'), ('triceps', 'Tríceps'),
        ('core', 'Core / Abdomen'), ('gluteos', 'Glúteos'), ('cardio', 'Cardio'),
        ('full_body', 'Full Body'),
    ]

    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='exercise_templates'
    )
    name = models.CharField(max_length=200)
    muscle_group = models.CharField(max_length=30, choices=MUSCLE_GROUPS)
    equipment = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    image = models.ImageField(
        upload_to='exercises/',
        null=True, blank=True,
        help_text='Foto de la máquina o demo del ejercicio'
    )
    increment_type = models.CharField(
        max_length=20, choices=INCREMENT_TYPES, default='kg_2_5'
    )
    plate_weight_kg = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text='Peso de 1 placa (solo si increment_type=plate)'
    )
    custom_increment_kg = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text='Incremento personalizado en kg'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['muscle_group', 'name']

    def __str__(self):
        return f'{self.name} ({self.get_muscle_group_display()})'

    def get_increment_kg(self):
        if self.increment_type == 'plate':
            return float(self.plate_weight_kg or 0)
        if self.increment_type == 'kg_2_5':
            return 2.5
        if self.increment_type == 'kg_5':
            return 5.0
        if self.increment_type == 'custom':
            return float(self.custom_increment_kg or 0)
        return 0.0


class RoutineTemplate(models.Model):
    """Rutina fija mensual creada por el entrenador."""
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='routine_templates'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_weeks = models.IntegerField(default=4)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.trainer.email})'

    @property
    def total_sessions(self):
        return self.sessions.count()


class SessionTemplate(models.Model):
    """Una sesión (A, B, C…) con exactamente 5 ejercicios."""
    routine = models.ForeignKey(
        RoutineTemplate, on_delete=models.CASCADE, related_name='sessions'
    )
    order = models.PositiveIntegerField(help_text='Orden en el bucle: 1=A, 2=B, 3=C…')
    label = models.CharField(max_length=10, help_text='A, B, C…')
    focus = models.CharField(
        max_length=200, blank=True,
        help_text='Ej: Empuje, Tirón, Piernas'
    )

    class Meta:
        ordering = ['order']
        unique_together = ['routine', 'order']

    def __str__(self):
        return f'{self.routine.name} - Sesión {self.label}'

    def clean(self):
        if self.pk and self.slots.count() > 5:
            from django.core.exceptions import ValidationError
            raise ValidationError('Una sesión solo puede tener 5 ejercicios.')


class SessionExerciseSlot(models.Model):
    """
    Cada uno de los 5 ejercicios de una sesión.
    Regla: 3 principales + 2 secundarios.
    """
    ROLE_CHOICES = [
        ('main', 'Principal'),
        ('secondary', 'Secundario'),
    ]

    session = models.ForeignKey(
        SessionTemplate, on_delete=models.CASCADE, related_name='slots'
    )
    exercise_template = models.ForeignKey(
        ExerciseTemplate, on_delete=models.PROTECT
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    order = models.PositiveIntegerField(help_text='1-5 dentro de la sesión')

    initial_weight_kg = models.DecimalField(
        max_digits=6, decimal_places=2, default=0
    )
    target_reps_min = models.PositiveIntegerField(default=12)
    target_reps_max = models.PositiveIntegerField(default=15)
    target_sets = models.PositiveIntegerField(default=3)
    rest_seconds = models.PositiveIntegerField(default=60)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ['session', 'order']

    def __str__(self):
        return f'{self.session} - {self.order}. {self.exercise_template.name} ({self.role})'


class ClientAssignment(models.Model):
    """Rutina asignada a un cliente. Aquí vive el bucle de sesiones."""
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='assigned_routines'
    )
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='assignments_made'
    )
    routine = models.ForeignKey(
        RoutineTemplate, on_delete=models.PROTECT, related_name='assignments'
    )
    start_date = models.DateField(auto_now_add=True)
    current_session_index = models.PositiveIntegerField(
        default=0, help_text='Índice de la próxima sesión a realizar (0-based)'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.client.email} → {self.routine.name}'

    def get_next_session(self):
        sessions = list(self.routine.sessions.all())
        if not sessions:
            return None
        idx = self.current_session_index % len(sessions)
        return sessions[idx]

    def advance_session(self):
        self.current_session_index += 1
        self.save(update_fields=['current_session_index'])


class SessionLog(models.Model):
    """Registro de una sesión ejecutada por el cliente."""
    assignment = models.ForeignKey(
        ClientAssignment, on_delete=models.CASCADE, related_name='session_logs'
    )
    session_template = models.ForeignKey(
        SessionTemplate, on_delete=models.PROTECT
    )
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    rpe = models.PositiveIntegerField(null=True, blank=True, help_text='1-10')
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.assignment.client.email} - {self.session_template.label} ({self.started_at.date()})'


class SetLog(models.Model):
    """Una serie registrada: reps reales + peso usado."""
    session_log = models.ForeignKey(
        SessionLog, on_delete=models.CASCADE, related_name='sets'
    )
    slot = models.ForeignKey(
        SessionExerciseSlot, on_delete=models.CASCADE, related_name='sets'
    )
    set_number = models.PositiveIntegerField()
    reps_done = models.PositiveIntegerField()
    weight_used_kg = models.DecimalField(max_digits=6, decimal_places=2)
    reached_failure = models.BooleanField(
        default=False,
        help_text='El cliente llegó al fallo técnico en esta serie'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['slot__order', 'set_number']
        unique_together = ['session_log', 'slot', 'set_number']

    def __str__(self):
        return f'{self.slot.exercise_template.name} - Serie {self.set_number}: {self.reps_done} reps @ {self.weight_used_kg}kg'


class ExerciseProgression(models.Model):
    """
    Estado de progresión por (cliente, slot). Guarda el peso actual vigente
    y si está listo para subir.
    """
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='progressions'
    )
    slot = models.ForeignKey(
        SessionExerciseSlot, on_delete=models.CASCADE, related_name='progressions'
    )
    current_weight_kg = models.DecimalField(max_digits=6, decimal_places=2)
    ready_to_increase = models.BooleanField(default=False)
    last_evaluated_at = models.DateTimeField(auto_now=True)
    times_increased = models.PositiveIntegerField(default=0)
    last_failure_logged = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['client', 'slot']

    def __str__(self):
        return f'{self.client.email} - {self.slot.exercise_template.name}: {self.current_weight_kg}kg'


# ============================================================
# BLACK GYM: PUNTOS DE PROGRESO DEL COACH
# ============================================================

class CoachProgressAction(models.Model):
    ACTION_CHOICES = (
        ('confirm_result', 'Confirmar resultado de serie'),
        ('correct_technique', 'Corregir técnica'),
        ('guide_to_failure', 'Guiar serie al fallo'),
        ('teach_progression', 'Enseñar sobrecarga progresiva'),
        ('reinforce_good', 'Reforzar buena ejecución'),
        ('explain_structure', 'Explicar estructura del entrenamiento'),
        ('update_structure', 'Actualizar estructura de entrenamiento'),
        ('other', 'Otra acción'),
    )
    coach = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coach_progress_actions')
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_progress_points')
    assignment = models.ForeignKey('workouts.ClientAssignment', on_delete=models.SET_NULL, null=True, blank=True)
    session_log = models.ForeignKey('workouts.SessionLog', on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=40, choices=ACTION_CHOICES)
    notes = models.TextField(blank=True, default='')
    generated_progress_point = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Acción de progreso del coach'
        verbose_name_plural = 'Acciones de progreso del coach'

    def __str__(self):
        return f'{self.coach.email} → {self.client.email}: {self.action}'


# ============================================================
# NUEVO: TABLERO DE PROGRESO MENSUAL (BLACK GYM)
# ============================================================

class MonthlyProgressBoard(models.Model):
    """
    Tablero mensual de 8 sesiones con meta, bloque y fases semanales.
    Corresponde al formulario impreso de BLACK GYM.
    """
    GOAL_CHOICES = [
        ('grasa', 'Pérdida de grasa'),
        ('musculo', 'Ganancia de músculo'),
        ('recomposicion', 'Recomposición corporal'),
    ]
    STATUS_CHOICES = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado'),
    ]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='monthly_boards'
    )
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='boards_created'
    )
    month = models.DateField(help_text='Primer día del mes del tablero')
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES)
    training_block = models.CharField(
        max_length=200, help_text='Ej: Tren Inferior (Frecuencia 2)'
    )
    frequency_per_week = models.PositiveIntegerField(default=2)
    total_sessions = models.PositiveIntegerField(default=8)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-month']
        unique_together = ['client', 'month']
        verbose_name = 'Tablero de progreso mensual'
        verbose_name_plural = 'Tableros de progreso mensual'

    def __str__(self):
        return f'{self.client.email} - {self.month:%Y-%m} ({self.training_block})'


class BoardSession(models.Model):
    """
    Cada una de las 8 sesiones del tablero mensual con su fase.
    """
    PHASE_CHOICES = [
        ('impacto', 'Impacto (Semanas 1-2)'),
        ('descarga', 'Descarga (Semana 3)'),
        ('potencia', 'Fuerza / Potencia (Semana 4)'),
    ]

    board = models.ForeignKey(
        MonthlyProgressBoard, on_delete=models.CASCADE, related_name='sessions'
    )
    session_number = models.PositiveIntegerField(help_text='1 a 8')
    week_number = models.PositiveIntegerField(help_text='1 a 4')
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES)
    date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['session_number']
        unique_together = ['board', 'session_number']

    def __str__(self):
        return f'{self.board} - Sesión {self.session_number} ({self.get_phase_display()})'


class BoardExerciseEntry(models.Model):
    """
    Fila del tablero: un ejercicio (slot) con su control P (peso) y R (reps)
    por cada sesión del mes.
    """
    board = models.ForeignKey(
        MonthlyProgressBoard, on_delete=models.CASCADE, related_name='entries'
    )
    slot = models.ForeignKey(
        SessionExerciseSlot, on_delete=models.PROTECT,
        related_name='board_entries'
    )
    order = models.PositiveIntegerField(help_text='1-5 en la tabla')

    class Meta:
        ordering = ['order']
        unique_together = ['board', 'slot']

    def __str__(self):
        return f'{self.board} - {self.order}. {self.slot.exercise_template.name}'


class BoardExerciseSessionData(models.Model):
    """
    Celda P/R de la tabla: peso y reps para una (entry, sesión) concreta.
    """
    entry = models.ForeignKey(
        BoardExerciseEntry, on_delete=models.CASCADE, related_name='session_data'
    )
    board_session = models.ForeignKey(
        BoardSession, on_delete=models.CASCADE, related_name='exercise_data'
    )
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    reps_done = models.PositiveIntegerField(null=True, blank=True)
    reached_failure = models.BooleanField(default=False)
    coach_note = models.CharField(max_length=200, blank=True, default='')

    class Meta:
        unique_together = ['entry', 'board_session']

    def __str__(self):
        return f'{self.entry} · S{self.board_session.session_number}: {self.weight_kg}kg x {self.reps_done}'


# ============================================================
# NUEVO: MÉTODO ENSEÑANDO A ENTRENAR (5 PUNTOS DE PROGRESO)
# ============================================================

class ClientLearningPoint(models.Model):
    """
    Los 5 Puntos de Progreso del 'Método Enseñando a Entrenar'.
    Uno por cliente. Cada punto se marca cuando el cliente demuestra el
    indicador de cumplimiento.
    """
    client = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='learning_points'
    )

    # 1. Conoce su estructura
    knows_structure = models.BooleanField(
        default=False,
        help_text='Conoce grupo muscular, 3 principales, 2 complementarios y siguiente sesión.'
    )
    knows_structure_verified_at = models.DateTimeField(null=True, blank=True)
    knows_structure_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    # 2. Ejecuta correctamente
    executes_correctly = models.BooleanField(default=False)
    executes_correctly_verified_at = models.DateTimeField(null=True, blank=True)
    executes_correctly_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    # 3. Sabe progresar
    knows_progression = models.BooleanField(default=False)
    knows_progression_verified_at = models.DateTimeField(null=True, blank=True)
    knows_progression_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    # 4. Entrena con autonomía
    trains_autonomously = models.BooleanField(default=False)
    trains_autonomously_verified_at = models.DateTimeField(null=True, blank=True)
    trains_autonomously_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    # 5. Su estructura evoluciona
    understands_evolution = models.BooleanField(default=False)
    understands_evolution_verified_at = models.DateTimeField(null=True, blank=True)
    understands_evolution_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Puntos de aprendizaje del cliente'
        verbose_name_plural = 'Puntos de aprendizaje del cliente'

    def __str__(self):
        return f'Aprendizaje de {self.client.email}'

    @property
    def completed_count(self):
        return sum([
            self.knows_structure,
            self.executes_correctly,
            self.knows_progression,
            self.trains_autonomously,
            self.understands_evolution,
        ])

    @property
    def completion_percentage(self):
        return round(self.completed_count / 5 * 100)


class StructureChangeLog(models.Model):
    """
    Historial de cambios de estructura (actualizaciones de rutina).
    Responde al punto 5 del Método: 'Su estructura evoluciona'.
    """
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='structure_changes'
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )
    assignment = models.ForeignKey(
        ClientAssignment, on_delete=models.SET_NULL, null=True, blank=True
    )
    change_type = models.CharField(
        max_length=40,
        choices=[
            ('exercise_swap', 'Cambio de ejercicio'),
            ('weight_update', 'Actualización de peso'),
            ('sets_reps_update', 'Cambio de series/reps'),
            ('session_reorder', 'Reordenamiento de sesiones'),
            ('routine_change', 'Cambio de rutina'),
        ]
    )
    reason = models.TextField(
        help_text='Motivo del cambio que el cliente debe comprender.'
    )
    detail = models.TextField(blank=True, default='')
    client_acknowledged = models.BooleanField(
        default=False,
        help_text='El cliente comprendió el motivo del cambio.'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cambio de estructura'
        verbose_name_plural = 'Cambios de estructura'

    def __str__(self):
        return f'{self.client.email} · {self.change_type} · {self.created_at:%Y-%m-%d}'