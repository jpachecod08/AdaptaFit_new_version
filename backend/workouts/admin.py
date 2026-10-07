from django.contrib import admin
from .models import (
    ClientAssignment, Exercise, ExerciseProgression, ExerciseTemplate,
    RoutineTemplate, SessionExerciseSlot, SessionLog, SessionTemplate,
    SetLog, WorkoutDay, WorkoutExercise, WorkoutHistory, WorkoutPlan,
    MonthlyProgressBoard, BoardSession, BoardExerciseEntry,
    BoardExerciseSessionData, ClientLearningPoint, StructureChangeLog,
    CoachProgressAction,
)

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
    list_display = ('session_log', 'slot', 'set_number', 'weight_used_kg',
                    'reps_done', 'reached_failure')
    list_filter = ('weight_used_kg', 'reached_failure')


@admin.register(ExerciseProgression)
class ExerciseProgressionAdmin(admin.ModelAdmin):
    list_display = ('client', 'slot', 'current_weight_kg', 'times_increased',
                    'ready_to_increase')
    list_filter = ('ready_to_increase',)


# ============================================================
# TABLERO DE PROGRESO MENSUAL
# ============================================================

class BoardExerciseSessionDataInline(admin.TabularInline):
    model = BoardExerciseSessionData
    extra = 0
    fields = ('board_session', 'weight_kg', 'reps_done', 'reached_failure', 'coach_note')


class BoardExerciseEntryInline(admin.TabularInline):
    model = BoardExerciseEntry
    extra = 0
    fields = ('order', 'slot')


@admin.register(MonthlyProgressBoard)
class MonthlyProgressBoardAdmin(admin.ModelAdmin):
    list_display = ('client', 'month', 'goal', 'training_block',
                    'frequency_per_week', 'status')
    list_filter = ('goal', 'status', 'month')
    search_fields = ('client__email', 'client__nombre', 'training_block')
    inlines = [BoardExerciseEntryInline]


@admin.register(BoardSession)
class BoardSessionAdmin(admin.ModelAdmin):
    list_display = ('board', 'session_number', 'week_number', 'phase', 'date')
    list_filter = ('phase', 'week_number')


@admin.register(BoardExerciseEntry)
class BoardExerciseEntryAdmin(admin.ModelAdmin):
    list_display = ('board', 'order', 'slot')
    list_filter = ('board',)


@admin.register(BoardExerciseSessionData)
class BoardExerciseSessionDataAdmin(admin.ModelAdmin):
    list_display = ('entry', 'board_session', 'weight_kg', 'reps_done',
                    'reached_failure')
    list_filter = ('reached_failure', 'board_session__phase')


# ============================================================
# MÉTODO ENSEÑANDO A ENTRENAR
# ============================================================

@admin.register(ClientLearningPoint)
class ClientLearningPointAdmin(admin.ModelAdmin):
    list_display = ('client', 'knows_structure', 'executes_correctly',
                    'knows_progression', 'trains_autonomously',
                    'understands_evolution', 'completion_percentage')
    list_filter = ('knows_structure', 'executes_correctly', 'knows_progression',
                   'trains_autonomously', 'understands_evolution')
    search_fields = ('client__email', 'client__nombre')
    readonly_fields = ('updated_at',)


@admin.register(StructureChangeLog)
class StructureChangeLogAdmin(admin.ModelAdmin):
    list_display = ('client', 'change_type', 'changed_by', 'created_at',
                    'client_acknowledged')
    list_filter = ('change_type', 'client_acknowledged')
    search_fields = ('client__email', 'reason')


# ============================================================
# COACH
# ============================================================

@admin.register(CoachProgressAction)
class CoachProgressActionAdmin(admin.ModelAdmin):
    list_display = ('coach', 'client', 'action', 'created_at',
                    'generated_progress_point')
    list_filter = ('action', 'generated_progress_point')
    search_fields = ('coach__email', 'client__email')