# workouts/models.py
from django.db import models
from django.conf import settings  # ¡IMPORTANTE!
from django.contrib.auth.models import User

class Exercise(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)  # fuerza/cardio/funcional
    equipment = models.CharField(max_length=200, blank=True)  # mancuernas, banda, ninguno
    description = models.TextField(blank=True)
    difficulty = models.IntegerField(null=True, blank=True)  # 1-5
    video_url = models.URLField(blank=True)  # URL del video ilustrativo (YouTube/otros)
    video_query = models.CharField(max_length=300, blank=True)  # query de búsqueda para el frontend

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
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='workout_days')  # Cambiado a workout_days
    day_index = models.IntegerField()  # orden
    name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'{self.plan.title} - {self.name or self.day_index}'

class WorkoutExercise(models.Model):
    day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='workout_exercises')  # Cambiado a workout_exercises
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
    rpe = models.IntegerField(null=True, blank=True)  # 1-10
    comments = models.TextField(blank=True)


class UserProgress(models.Model):
    # CORREGIDO: usar settings.AUTH_USER_MODEL en lugar de User directamente
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    exercise = models.ForeignKey('Exercise', on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'exercise']
    
    def __str__(self):
        return f"{self.user.username} - {self.exercise.name} - {self.completed}"

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
        """Devuelve cuánto subir en kg según configuración."""
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
        # Validación suave: máximo 5 slots
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

    # Configuración del mes
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
        """Devuelve la próxima sesión del bucle (circular)."""
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

    class Meta:
        unique_together = ['client', 'slot']

    def __str__(self):
        return f'{self.client.email} - {self.slot.exercise_template.name}: {self.current_weight_kg}kg'
