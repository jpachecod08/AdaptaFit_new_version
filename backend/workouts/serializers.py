from rest_framework import serializers
from .models import (
    Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutHistory,
    MonthlyProgressBoard, BoardSession, BoardExerciseEntry,
    BoardExerciseSessionData, ClientLearningPoint, StructureChangeLog,
    CoachProgressAction,
)


# ============================================================
# SERIALIZERS ORIGINALES
# ============================================================

class WorkoutExerciseSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    video_query = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutExercise
        fields = ['id', 'name', 'sets', 'reps', 'rest_seconds', 'notes', 'video_url', 'video_query']

    def get_video_url(self, obj):
        if obj.exercise and obj.exercise.video_url:
            return obj.exercise.video_url
        return ''

    def get_video_query(self, obj):
        if obj.exercise and obj.exercise.video_query:
            return obj.exercise.video_query
        return obj.name


class WorkoutDaySerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(source='workout_exercises', many=True, read_only=True)

    class Meta:
        model = WorkoutDay
        fields = ['id', 'day_index', 'name', 'exercises']


class WorkoutPlanSerializer(serializers.ModelSerializer):
    days = WorkoutDaySerializer(source='workout_days', many=True, read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = ['id', 'title', 'generated_at', 'last_modified', 'source', 'notes', 'days']


class WorkoutHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutHistory
        fields = '__all__'


# ============================================================
# SERIALIZERS: TABLERO DE PROGRESO MENSUAL
# ============================================================

class BoardExerciseSessionDataSerializer(serializers.ModelSerializer):
    session_number = serializers.IntegerField(source='board_session.session_number', read_only=True)
    phase = serializers.CharField(source='board_session.phase', read_only=True)

    class Meta:
        model = BoardExerciseSessionData
        fields = [
            'id', 'session_number', 'phase',
            'weight_kg', 'reps_done', 'reached_failure', 'coach_note',
        ]


class BoardExerciseEntrySerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='slot.exercise_template.name', read_only=True)
    role = serializers.CharField(source='slot.role', read_only=True)
    muscle_group = serializers.CharField(source='slot.exercise_template.muscle_group', read_only=True)
    session_data = BoardExerciseSessionDataSerializer(many=True, read_only=True)

    class Meta:
        model = BoardExerciseEntry
        fields = [
            'id', 'order', 'exercise_name', 'role', 'muscle_group',
            'session_data',
        ]


class BoardSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardSession
        fields = ['id', 'session_number', 'week_number', 'phase', 'date', 'notes']


class MonthlyProgressBoardSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source='client.email', read_only=True)
    client_name = serializers.SerializerMethodField()
    sessions = BoardSessionSerializer(many=True, read_only=True)
    entries = BoardExerciseEntrySerializer(many=True, read_only=True)

    class Meta:
        model = MonthlyProgressBoard
        fields = [
            'id', 'client', 'client_email', 'client_name',
            'month', 'goal', 'training_block', 'frequency_per_week',
            'total_sessions', 'status',
            'sessions', 'entries',
        ]

    def get_client_name(self, obj):
        return obj.client.nombre or obj.client.email.split('@')[0]


class MonthlyProgressBoardListSerializer(serializers.ModelSerializer):
    """Versión ligera para listados (dashboard)."""
    client_email = serializers.EmailField(source='client.email', read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyProgressBoard
        fields = [
            'id', 'client_email', 'month', 'goal', 'training_block',
            'frequency_per_week', 'total_sessions', 'status',
            'progress_percentage',
        ]

    def get_progress_percentage(self, obj):
        total = obj.sessions.count() * 5  # 5 ejercicios por sesión
        if not total:
            return 0
        done = BoardExerciseSessionData.objects.filter(
            entry__board=obj, reps_done__isnull=False
        ).count()
        return round(done / total * 100)


# ============================================================
# SERIALIZERS: MÉTODO ENSEÑANDO A ENTRENAR
# ============================================================

class ClientLearningPointSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source='client.email', read_only=True)
    completed_count = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = ClientLearningPoint
        fields = [
            'id', 'client', 'client_email',
            'knows_structure', 'knows_structure_verified_at',
            'executes_correctly', 'executes_correctly_verified_at',
            'knows_progression', 'knows_progression_verified_at',
            'trains_autonomously', 'trains_autonomously_verified_at',
            'understands_evolution', 'understands_evolution_verified_at',
            'completed_count', 'completion_percentage',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class StructureChangeLogSerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source='changed_by.email', read_only=True, default=None)

    class Meta:
        model = StructureChangeLog
        fields = [
            'id', 'client', 'changed_by', 'changed_by_email',
            'assignment', 'change_type', 'reason', 'detail',
            'client_acknowledged', 'created_at',
        ]
        read_only_fields = ['created_at']


# ============================================================
# SERIALIZERS: COACH
# ============================================================

class CoachProgressActionSerializer(serializers.ModelSerializer):
    coach_email = serializers.EmailField(source='coach.email', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)

    class Meta:
        model = CoachProgressAction
        fields = [
            'id', 'coach', 'coach_email', 'client', 'client_email',
            'assignment', 'session_log', 'action', 'notes',
            'generated_progress_point', 'created_at',
        ]
        read_only_fields = ['created_at']