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