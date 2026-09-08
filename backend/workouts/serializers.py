from rest_framework import serializers
from .models import Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutHistory

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
    # ✅ CORREGIDO
    exercises = WorkoutExerciseSerializer(source='workout_exercises', many=True, read_only=True)
    
    class Meta:
        model = WorkoutDay
        fields = ['id', 'day_index', 'name', 'exercises']

class WorkoutPlanSerializer(serializers.ModelSerializer):
    # ✅ CORREGIDO  
    days = WorkoutDaySerializer(source='workout_days', many=True, read_only=True)
    
    class Meta:
        model = WorkoutPlan
        fields = ['id', 'title', 'generated_at', 'last_modified', 'source', 'notes', 'days']

class WorkoutHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutHistory
        fields = '__all__'