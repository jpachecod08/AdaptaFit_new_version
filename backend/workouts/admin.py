from django.contrib import admin

from .models import (ClientAssignment, Exercise, ExerciseProgression, ExerciseTemplate,
                     RoutineTemplate, SessionExerciseSlot, SessionLog, SessionTemplate,
                     SetLog, WorkoutDay, WorkoutExercise, WorkoutHistory, WorkoutPlan)

admin.site.register(Exercise)
admin.site.register(WorkoutPlan)
admin.site.register(WorkoutDay)
admin.site.register(WorkoutExercise)
admin.site.register(WorkoutHistory)


@admin.register(ExerciseTemplate)
class ExerciseTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'muscle_group', 'trainer', 'image')
    search_fields = ('name', 'muscle_group')
    list_filter = ('muscle_group',)


@admin.register(RoutineTemplate)
class RoutineTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'trainer', 'created_at')
    search_fields = ('name', 'trainer__email')
    list_filter = ('trainer',)


@admin.register(SessionTemplate)
class SessionTemplateAdmin(admin.ModelAdmin):
    list_display = ('label', 'routine', 'order', 'focus')
    list_filter = ('focus',)


@admin.register(SessionExerciseSlot)
class SessionExerciseSlotAdmin(admin.ModelAdmin):
    list_display = ('exercise_template', 'session', 'order', 'role',
                    'initial_weight_kg', 'target_sets')
    list_filter = ('role',)


@admin.register(ClientAssignment)
class ClientAssignmentAdmin(admin.ModelAdmin):
    list_display = ('client', 'trainer', 'routine', 'is_active',
                    'current_session_index', 'start_date')
    list_filter = ('is_active', 'trainer')
    search_fields = ('client__email', 'routine__name')


@admin.register(SessionLog)
class SessionLogAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'session_template', 'started_at', 'finished_at',
                    'is_completed')
    list_filter = ('is_completed',)


@admin.register(SetLog)
class SetLogAdmin(admin.ModelAdmin):
    list_display = ('session_log', 'slot', 'set_number', 'weight_used_kg', 'reps_done')
    list_filter = ('weight_used_kg',)


@admin.register(ExerciseProgression)
class ExerciseProgressionAdmin(admin.ModelAdmin):
    list_display = ('client', 'slot', 'current_weight_kg', 'times_increased',
                    'ready_to_increase')
    list_filter = ('ready_to_increase',)
