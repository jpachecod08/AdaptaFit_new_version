from django.db import models
from django.conf import settings

class Exercise(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)  # fuerza/cardio/funcional
    equipment = models.CharField(max_length=200, blank=True)  # mancuernas, banda, ninguno
    description = models.TextField(blank=True)
    difficulty = models.IntegerField(null=True, blank=True)  # 1-5

    def __str__(self):
        return self.name

class WorkoutPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workout_plans')
    title = models.CharField(max_length=200, default='Rutina personalizada')
    generated_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=50, default='rules+llm')
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.title} - {self.user.email}'

class WorkoutDay(models.Model):
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='days')
    day_index = models.IntegerField()  # orden
    name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'{self.plan.title} - {self.name or self.day_index}'

class WorkoutExercise(models.Model):
    day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='exercises')
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
