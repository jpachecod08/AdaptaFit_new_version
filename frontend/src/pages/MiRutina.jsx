import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  List,
  ListItem,
  Button,
  Box,
  CircularProgress,
  TextField,
  IconButton,
  Card,
  CardContent,
  styled,
  useTheme,
  Grid,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  Alert,
} from '@mui/material';
import {
  Dumbbell,
  Calendar,
  ListChecks,
  ChevronLeft,
  MessageCircle,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  Play,
  X,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';

// ✅ CONFIGURACIÓN CORREGIDA PARA NETLIFY
// import { API_URL } from '../config';
const API_URL = 'https://adaptafit.onrender.com';
console.log('🔧 Usando API_URL:', API_URL);
// Utilitarios de autenticación
const getAuthToken = (navigate) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    navigate('/login');
    throw new Error('No autenticado');
  }
  return token;
};

// Componentes estilizados
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  fontWeight: 'bold',
  textTransform: 'none',
  padding: '8px 16px',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const MessageBase = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  padding: '1rem',
  borderRadius: '1rem',
  animation: 'fadeIn 0.5s ease-in-out',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
});

const AiMessage = styled(MessageBase)({
  backgroundColor: '#e0f7fa',
  border: '1px solid #b2ebf2',
});

const UserMessage = styled(MessageBase)({
  backgroundColor: '#fafafa',
  border: '1px solid #e0e0e0',
});

// Base de datos de videos por ejercicio - MEJORADA Y ÚNICA
const exerciseVideos = {
  // Ejercicios de pecho - VIDEOS ÚNICOS
  'flexiones': 'https://www.youtube.com/embed/IODxDxX7oi4',
  'press de banca': 'https://www.youtube.com/embed/rT7DgCr-3pg',
  'press inclinado': 'https://www.youtube.com/embed/SrqOu55lrYU',
  'press declinado': 'https://www.youtube.com/embed/LfyQBUKR8SE',
  'cruces en polea': 'https://www.youtube.com/embed/Iwe6AmxVf7o',
  'press con mancuernas': 'https://www.youtube.com/embed/VmB1G1K7v94',
  'press inclinado mancuernas': 'https://www.youtube.com/embed/0G2_XV7slIg',
  'fondos en paralelas': 'https://www.youtube.com/embed/2z8JmcrW-As',
  'aperturas con mancuernas': 'https://www.youtube.com/embed/Z57CtFmRMxA',
  'pull over': 'https://www.youtube.com/embed/b6nVSoqBc_I',

  // Ejercicios de piernas - VIDEOS ÚNICOS
  'sentadillas': 'https://www.youtube.com/embed/aclHkVaku9U',
  'sentadillas con barra': 'https://www.youtube.com/embed/U3HlEF_E9e4',
  'prensa': 'https://www.youtube.com/embed/IZxyjW7MPJQ',
  'zancadas': 'https://www.youtube.com/embed/D7KaRcUTQeE',
  'prensa de piernas': 'https://www.youtube.com/embed/1y_u1R0tO8s',
  'extensiones de cuádriceps': 'https://www.youtube.com/embed/YyvSfVjQeL0',
  'curl de femoral': 'https://www.youtube.com/embed/1Tq3QdYUuHs',
  'elevación de talones': 'https://www.youtube.com/embed/3UWi44yN-wM',
  'peso muerto': 'https://www.youtube.com/embed/r4MzxtBKyNE',
  'sentadilla búlgara': 'https://www.youtube.com/embed/2C-uNgKwPLE',

  // Ejercicios de espalda - VIDEOS ÚNICOS
  'dominadas': 'https://www.youtube.com/embed/eGo4IYlbE5g',
  'dominadas supinas': 'https://www.youtube.com/embed/4tFvyVf4UP8',
  'remo con barra': 'https://www.youtube.com/embed/axoeDmW0oAY',
  'remo con mancuerna': 'https://www.youtube.com/embed/pYcpY20QaE8',
  'jalón al pecho': 'https://www.youtube.com/embed/CAwf7n6Luuc',
  'remo en polea baja': 'https://www.youtube.com/embed/GZbfZ033f74',
  'peso muerto rumano': 'https://www.youtube.com/embed/JCXUYuzwNrM',

  // Ejercicios de hombros - VIDEOS ÚNICOS
  'press militar': 'https://www.youtube.com/embed/2yjwXTZQDDI',
  'press militar mancuernas': 'https://www.youtube.com/embed/B-aVuyhvLHU',
  'elevaciones laterales': 'https://www.youtube.com/embed/3VcKaXpzqRo',
  'elevaciones frontales': 'https://www.youtube.com/embed/-t7fuZ0KhDA',
  'face pulls': 'https://www.youtube.com/embed/fozN-A5hREs',

  // Ejercicios de bíceps - VIDEOS ÚNICOS
  'curl de bíceps': 'https://www.youtube.com/embed/ykJmrZ5v0Oo',
  'curl martillo': 'https://www.youtube.com/embed/zC3nLlEvin4',
  'curl concentrado': 'https://www.youtube.com/embed/0AUGkch3tzc',
  'curl en banco scott': 'https://www.youtube.com/embed/fIWP-FRFNU0',

  // Ejercicios de tríceps - VIDEOS ÚNICOS
  'extensiones de tríceps': 'https://www.youtube.com/embed/6Fc0S7IzNc0',
  'fondos en banco': 'https://www.youtube.com/embed/0326dy_-CzM',
  'press francés': 'https://www.youtube.com/embed/riAutegDqdI',
  'patada de tríceps': 'https://www.youtube.com/embed/_gsUck-7M74',

  // Ejercicios de abdominales - VIDEOS ÚNICOS
  'crunch': 'https://www.youtube.com/embed/Xyd_fa5zoEU',
  'plancha': 'https://www.youtube.com/embed/pSHjTRCQxIw',
  'elevaciones de piernas': 'https://www.youtube.com/embed/l4kQd9eWclE',
  'rusas twists': 'https://www.youtube.com/embed/wkD8rjkodUI',

  // Ejercicios cardiovasculares - VIDEOS ÚNICOS
  'burpees': 'https://www.youtube.com/embed/qLBImHhCXSw',
  'saltos de tijera': 'https://www.youtube.com/embed/c4DAnQ6DtF8',
  'correr en sitio': 'https://www.youtube.com/embed/43RkwWtW7_I',
  'escaladores': 'https://www.youtube.com/embed/cnyTQDSE884',
};

// Función MEJORADA para encontrar el video correspondiente al ejercicio
const findExerciseVideo = (exerciseName) => {
  const name = exerciseName.toLowerCase().trim();
  
  // Mapeo específico de ejercicios comunes a sus videos únicos
  const exerciseMapping = {
    'press banca': 'press de banca',
    'press plano': 'press de banca',
    'press pecho': 'press de banca',
    'aperturas': 'aperturas con mancuernas',
    'fondos': 'fondos en paralelas',
    'pullover': 'pull over',
    'sentadilla': 'sentadillas',
    'prensa piernas': 'prensa',
    'desplante': 'zancadas',
    'zancada': 'zancadas',
    'dominada': 'dominadas',
    'remo': 'remo con barra',
    'press hombros': 'press militar',
    'elevaciones': 'elevaciones laterales',
    'curl': 'curl de bíceps',
    'extension triceps': 'extensiones de tríceps',
    'abdominales': 'crunch',
    'abdominal': 'crunch',
    'core': 'plancha',
    'burpee': 'burpees',
  };

  // Primero buscar en el mapeo específico
  for (const [key, mappedExercise] of Object.entries(exerciseMapping)) {
    if (name.includes(key)) {
      return exerciseVideos[mappedExercise] || exerciseVideos['flexiones'];
    }
  }

  // Buscar coincidencias exactas
  for (const [videoKey, videoUrl] of Object.entries(exerciseVideos)) {
    if (name === videoKey.toLowerCase() || name.includes(videoKey.toLowerCase())) {
      return videoUrl;
    }
  }

  // Búsqueda por palabras clave
  const keywordMapping = {
    'press': 'press de banca',
    'sentadilla': 'sentadillas',
    'curl': 'curl de bíceps',
    'extension': 'extensiones de tríceps',
    'remo': 'remo con barra',
    'dominada': 'dominadas',
    'fondo': 'fondos en paralelas',
    'plancha': 'plancha',
    'burpee': 'burpees',
    'abdominal': 'crunch',
  };

  for (const [keyword, defaultExercise] of Object.entries(keywordMapping)) {
    if (name.includes(keyword)) {
      return exerciseVideos[defaultExercise] || exerciseVideos['flexiones'];
    }
  }

  // Por defecto
  return 'https://www.youtube.com/embed/IODxDxX7oi4';
};

// Componente principal
const MiRutina = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const chatEndRef = useRef(null);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [completedExercises, setCompletedExercises] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showRegenerateAlert, setShowRegenerateAlert] = useState(false);
  const [videoDialog, setVideoDialog] = useState({
    open: false,
    exerciseName: '',
    videoUrl: ''
  });

  // Función para cargar ejercicios completados desde el backend
  const loadCompletedExercises = async (planData) => {
    try {
      const token = getAuthToken(navigate);
      
      // ✅ URL CORREGIDA
      const completedResponse = await axios.get(
        `${API_URL}/api/workouts/completed-exercises/`,
        {
          headers: { Authorization: `Token ${token}` }
        }
      );
      
      const completedExercisesData = completedResponse.data.completed_exercises || [];
      
      // Crear objeto de estado inicial
      const initialCompletedState = {};
      
      planData.days?.forEach(day => {
        day.exercises?.forEach(exercise => {
          initialCompletedState[exercise.id] = completedExercisesData.includes(exercise.id);
        });
      });
      
      setCompletedExercises(initialCompletedState);
      
    } catch (error) {
      console.error('Error al cargar ejercicios completados:', error);
      setCompletedExercises({});
    }
  };

  // Cargar datos iniciales CON REGENERACIÓN AUTOMÁTICA
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken(navigate);
        
        // ✅ URL CORREGIDA
        const profileResponse = await axios.get(`${API_URL}/api/users/profile/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        const userProfileData = profileResponse.data;
        setUserProfile(userProfileData);
        
        let userId = userProfileData.user_id || userProfileData.id;
        
        if (!userId && userProfileData.user && userProfileData.user.id) {
          userId = userProfileData.user.id;
        }
        
        if (!userId) {
          throw new Error('No se pudo identificar al usuario. User ID no encontrado.');
        }
        
        // ✅ URL CORREGIDA
        const planResponse = await axios.get(`${API_URL}/api/workouts/plans/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        const planData = planResponse.data;
        
        // VERIFICAR Y REGENERAR AUTOMÁTICAMENTE SI ES NECESARIO
        const diasEnPlan = planData.days?.length || 0;
        const frecuenciaActual = userProfileData.frecuencia || 3;
        
        if (diasEnPlan !== frecuenciaActual) {
          try {
            // ✅ URL CORREGIDA
            const regeneratedResponse = await axios.get(
              `${API_URL}/api/workouts/plans/usuario/${userId}/`,
              {
                headers: { Authorization: `Token ${token}` }
              }
            );
            
            const newPlanData = regeneratedResponse.data;
            setPlan(newPlanData);
            setShowRegenerateAlert(false);
            await loadCompletedExercises(newPlanData);
            
          } catch (regenerateError) {
            console.error('Error al regenerar automáticamente:', regenerateError);
            setShowRegenerateAlert(true);
            setPlan(planData);
            await loadCompletedExercises(planData);
          }
        } else {
          setPlan(planData);
          await loadCompletedExercises(planData);
        }
        
        // Cargar chat guardado
        const savedChat = localStorage.getItem(`chatHistory-${id}`);
        if (savedChat) setChatHistory(JSON.parse(savedChat));
        
      } catch (err) {
        console.error('Error:', err);
        setFetchError(err.response?.data?.detail || err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, navigate]);

  // Auto-scroll del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Función para regenerar el plan manualmente
  const handleRegeneratePlan = async () => {
    try {
      setRegenerating(true);
      const token = getAuthToken(navigate);
      
      const userId = userProfile?.user_id || userProfile?.id;
      
      if (!userId) {
        throw new Error('No se pudo obtener el ID de usuario del perfil. Recarga la página.');
      }
      
      // ✅ URL CORREGIDA
      const response = await axios.get(
        `${API_URL}/api/workouts/plans/usuario/${userId}/`,
        {
          headers: { Authorization: `Token ${token}` }
        }
      );
      
      setPlan(response.data);
      setShowRegenerateAlert(false);
      setChatHistory([]);
      localStorage.removeItem(`chatHistory-${id}`);
      
      await loadCompletedExercises(response.data);
      
    } catch (err) {
      console.error('Error al regenerar plan:', err);
      setFetchError(err.message || 'Error al actualizar el plan. Intenta nuevamente.');
    } finally {
      setRegenerating(false);
    }
  };

  // Función CORREGIDA para marcar ejercicio como completado
  const toggleCompleted = async (exerciseId, exerciseName) => {
    try {
      const token = getAuthToken(navigate);
      
      const newCompletedState = !completedExercises[exerciseId];
      
      // Actualización optimista del estado local
      setCompletedExercises(prev => ({
        ...prev,
        [exerciseId]: newCompletedState
      }));

      // ✅ URL CORREGIDA
      const response = await axios.post(
        `${API_URL}/api/workouts/complete-exercise/`,
        { 
          exercise_id: exerciseId 
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        // Revertir el cambio si falla
        setCompletedExercises(prev => ({
          ...prev,
          [exerciseId]: !newCompletedState
        }));
      }

    } catch (error) {
      console.error('Error al completar ejercicio:', error);
      
      // Revertir el cambio si hay error
      setCompletedExercises(prev => ({
        ...prev,
        [exerciseId]: !completedExercises[exerciseId]
      }));
      
      alert('Error al guardar el ejercicio completado. Intenta nuevamente.');
    }
  };

  const handleVideoOpen = (exerciseName) => {
    const videoUrl = findExerciseVideo(exerciseName);
    setVideoDialog({
      open: true,
      exerciseName,
      videoUrl
    });
  };

  const handleVideoClose = () => {
    setVideoDialog({
      open: false,
      exerciseName: '',
      videoUrl: ''
    });
  };

  const handleAiQuery = useCallback(async () => {
    if (!aiPrompt.trim() || aiLoading) return;

    try {
      const token = getAuthToken(navigate);
      const userMessage = { 
        role: 'user', 
        text: aiPrompt, 
        id: Date.now() 
      };

      // Actualización optimista del chat
      setChatHistory(prev => {
        const updatedChat = [...prev, userMessage];
        localStorage.setItem(`chatHistory-${id}`, JSON.stringify(updatedChat));
        return updatedChat;
      });

      setAiPrompt('');
      setAiLoading(true);

      // ✅ URL CORREGIDA
      const response = await axios.post(
        `${API_URL}/api/workouts/chat-asistente/`,
        { prompt: aiPrompt },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          }
        }
      );

      setChatHistory(prev => {
        const answer = {
          role: 'gemini',
          text: response.data?.answer || "No pude generar una respuesta.",
          id: Date.now() + 1
        };
        const updatedChat = [...prev, answer];
        localStorage.setItem(`chatHistory-${id}`, JSON.stringify(updatedChat));
        return updatedChat;
      });

    } catch (error) {
      if (error.message !== 'No autenticado') {
        setChatHistory(prev => [...prev, {
          role: 'gemini',
          text: "Error al conectar con el asistente. Intenta nuevamente.",
          id: Date.now()
        }]);
      }
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, aiLoading, id, navigate]);

  // Componente de ejercicio memoizado
  const ExerciseItem = React.memo(({ ex, completed, onToggleComplete, onVideoOpen }) => (
    <ListItem
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        alignItems: 'center',
        p: 2,
        mb: 1,
        borderRadius: 2,
        backgroundColor: completed ? '#e8f5e9' : '#fafafa',
        borderLeft: `5px solid ${completed ? theme.palette.success.main : theme.palette.primary.main}`,
        transition: 'background-color 0.3s, transform 0.2s',
        '&:hover': {
          transform: 'scale(1.01)',
          backgroundColor: completed ? '#dcedc8' : '#f0f0f0',
        },
      }}
    >
      <Box sx={{ flexGrow: 1, mr: 2 }}>
        <Typography
          variant="body1"
          fontWeight="bold"
          sx={{
            textDecoration: completed ? 'line-through' : 'none',
            color: completed ? 'gray' : 'inherit',
            mb: 1,
          }}
        >
          {ex.name}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Chip 
            label={`${ex.sets} sets`} 
            size="small" 
            variant="outlined" 
            color="primary" 
          />
          <Chip 
            label={`${ex.reps} reps`} 
            size="small" 
            variant="outlined" 
            color="secondary" 
          />
          <Chip 
            label={`${ex.rest_seconds || 0}s descanso`} 
            size="small" 
            variant="outlined" 
          />
        </Box>
        {ex.notes && (
          <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {ex.notes}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
        <IconButton
          onClick={() => onVideoOpen(ex.name)}
          sx={{
            backgroundColor: '#ff6b35',
            color: 'white',
            '&:hover': {
              backgroundColor: '#e55a2b',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
          aria-label={`Ver video de ${ex.name}`}
        >
          <Play size={20} />
        </IconButton>
        <StyledButton
          size="small"
          onClick={() => onToggleComplete(ex.id, ex.name)}
          sx={{
            backgroundColor: completed ? theme.palette.success.main : '#00838F',
            color: 'white',
            '&:hover': {
              backgroundColor: completed ? '#388e3c' : '#006064',
            },
            minWidth: '100px',
          }}
          startIcon={completed ? <CheckCircle2 size={16} /> : <ListChecks size={16} />}
        >
          {completed ? 'Hecho' : 'Marcar'}
        </StyledButton>
      </Box>
    </ListItem>
  ));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#00838F' }} />
      </Box>
    );
  }

  if (!plan || fetchError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          <XCircle size={32} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {fetchError || 'Plan de entrenamiento no encontrado.'}
        </Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <React.Fragment>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        py: { xs: 3, md: 6 },
        fontFamily: 'Roboto, sans-serif',
      }}>
        {/* Encabezado */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, px: { xs: 2, md: 4 } }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2, color: '#00838F' }}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#00838F' }}>
            Mi Rutina de Entrenamiento
          </Typography>
        </Box>

        {/* Alerta para regenerar plan si está desactualizado */}
        {showRegenerateAlert && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3, mx: { xs: 2, md: 4 } }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRegeneratePlan}
                disabled={regenerating}
                startIcon={regenerating ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
              >
                {regenerating ? 'Actualizando...' : 'Actualizar Plan'}
              </Button>
            }
          >
            Tu plan actual tiene {plan.days?.length} días, pero tu frecuencia es de {userProfile?.frecuencia} días. 
            Actualiza el plan para que coincida con tu frecuencia actual.
          </Alert>
        )}

        {/* Contenido principal */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ px: { xs: 2, md: 4 } }}>
          {/* Columna de rutina */}
          <Grid item xs={12} md={6}>
            <Card elevation={8} sx={{ 
              borderRadius: 4, 
              background: `linear-gradient(135deg, #00838F 10%, #004d40 90%)`, 
              color: 'white', 
              mb: 4 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Dumbbell size={32} style={{ marginRight: '1rem' }} />
                    <Typography variant="h5" fontWeight="bold">
                      {plan.title || 'Plan de Entrenamiento'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Generado: {new Date(plan.generated_at).toLocaleString()}
                </Typography>
                {userProfile && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Frecuencia: {userProfile.frecuencia} días/semana | Días en plan: {plan.days?.length}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Paper elevation={4} sx={{ borderRadius: 4, p: { xs: 3, md: 4 } }}>
              {plan?.days?.map((day) => (
                <Box key={day.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Calendar size={20} color="#00838F" />
                    <Typography variant="h6" fontWeight="bold" sx={{ ml: 1, color: '#00838F' }}>
                      {day.name || `Día ${day.day_index + 1}`}
                    </Typography>
                  </Box>
                  <List disablePadding>
                    {day.exercises.map((ex) => (
                      <ExerciseItem
                        key={ex.id}
                        ex={ex}
                        completed={completedExercises[ex.id]}
                        onToggleComplete={toggleCompleted}
                        onVideoOpen={handleVideoOpen}
                      />
                    ))}
                  </List>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Columna de chat */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mt: { xs: 4, md: 0 } }}>
              <Card elevation={8} sx={{ 
                borderRadius: 4, 
                background: `linear-gradient(45deg, #FFD700 30%, #FFA500 90%)`, 
                color: 'white', 
                mb: 4 
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MessageCircle size={32} style={{ marginRight: '1rem' }} />
                    <Typography variant="h5" fontWeight="bold">
                      Asistente de Entrenamiento
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Obtén consejos personalizados sobre tu rutina
                  </Typography>
                </CardContent>
              </Card>

              <Paper elevation={4} sx={{ 
                borderRadius: 4, 
                p: { xs: 3, md: 4 }, 
                display: 'flex', 
                flexDirection: 'column',
                height: 'calc(100% - 120px)'
              }}>
                <Box sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  mb: 2,
                  maxHeight: '60vh'
                }}>
                  {chatHistory.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      color: 'text.secondary', 
                      mt: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <Sparkles size={60} style={{ color: '#00838F' }} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        ¡Hola! Estoy aquí para ayudarte con tu rutina.
                      </Typography>
                      <Typography variant="body2">
                        ¿En qué puedo ayudarte hoy?
                      </Typography>
                    </Box>
                  ) : (
                    chatHistory.map((msg) => (
                      <Box 
                        key={msg.id}
                        sx={{ 
                          mb: 2, 
                          display: 'flex', 
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
                        }}
                      >
                        {msg.role === 'user' ? (
                          <UserMessage sx={{ maxWidth: '80%', background: '#00838F', color: 'white' }}>
                            <Typography variant="body2">{msg.text}</Typography>
                          </UserMessage>
                        ) : (
                          <AiMessage sx={{ 
                            maxWidth: '80%', 
                            background: '#b2ebf2', 
                            color: '#004d40',
                            whiteSpace: 'pre-wrap'
                          }}>
                            <Typography component="div">
                              {msg.text.split('\n').map((para, i) => (
                                <p key={i} style={{ margin: '0.5em 0' }}>{para}</p>
                              ))}
                            </Typography>
                          </AiMessage>
                        )}
                      </Box>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  pt: 2,
                  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Escribe tu pregunta..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                    disabled={aiLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        pr: 0,
                      },
                    }}
                    inputProps={{
                      'aria-label': 'Mensaje para el asistente IA',
                      maxLength: 500
                    }}
                    helperText={aiLoading ? "El asistente está pensando..." : ""}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleAiQuery}
                    disabled={aiLoading || !aiPrompt.trim()}
                    sx={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 2,
                      backgroundColor: '#00838F',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#006064',
                      },
                    }}
                    aria-label="Enviar mensaje"
                  >
                    {aiLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <Send />
                    )}
                  </IconButton>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* Dialog para videos */}
        <Dialog
          open={videoDialog.open}
          onClose={handleVideoClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4 }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: '#00838F',
            color: 'white'
          }}>
            <Typography variant="h6" fontWeight="bold">
              Tutorial: {videoDialog.exerciseName}
            </Typography>
            <IconButton onClick={handleVideoClose} sx={{ color: 'white' }}>
              <X />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={videoDialog.videoUrl}
                title={`Video tutorial de ${videoDialog.exerciseName}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '0 0 16px 16px'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </React.Fragment>
  );
};

export default MiRutina;