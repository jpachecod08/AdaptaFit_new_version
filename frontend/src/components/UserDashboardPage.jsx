import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Container,
  Button,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  styled,
  IconButton,
  Chip,
  CardActions,
  alpha,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
  LinearProgress,
} from '@mui/material';
import axios from 'axios';
import {
  Users,
  Dumbbell,
  LineChart as LineChartIcon,
  LogOut,
  ArrowLeft,
  Star,
  Check,
  Zap,
  Target,
  Clock,
  Crown,
  Users as UsersIcon,
  Sparkles,
  Activity,
  Heart,
  ArrowRight,
  Play,
  Calendar,
  User,
  Edit,
  TrendingUp,
  Flame,
  Award,
  Video,
  Bell,
  RotateCcw,
  CheckCircle,
  CheckCircle2,
} from 'lucide-react';
// import {API_URL} from '../config'
import BuscarEntrenadores from './BuscarEntrenadores';
// const API_URL = 'https://adaptafit.onrender.com';
const API_URL = import.meta.env.VITE_API_URL;

console.log('🔧 Usando API_URL:', API_URL);

// 🎨 Theme-aware styled components
const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.12)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const MembershipCard = styled(GlassCard, {
  shouldForwardProp: (prop) => prop !== 'isFeatured',
})(({ isFeatured, theme }) => ({
  position: 'relative',
  padding: isFeatured ? '32px 24px' : '24px',
  background: isFeatured 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.02)} 100%)`
    : alpha(theme.palette.background.paper, 0.7),
  border: isFeatured ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: '12px 32px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  },
  '&:disabled': {
    background: theme.palette.action.disabled,
    transform: 'none',
    boxShadow: 'none',
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: '12px 32px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  background: 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.04),
    border: `2px solid ${theme.palette.primary.main}`,
    transform: 'translateY(-2px)',
  },
}));

const FeatureIcon = styled(Box)(({ theme, color }) => ({
  width: '64px',
  height: '64px',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
  color: color,
  marginBottom: '16px',
}));

const UserDashboardPage = ({ token, onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rutinaLoading, setRutinaLoading] = useState(false);
  const navigate = useNavigate();
  const [showTrainers, setShowTrainers] = useState(false);
  
  // 🎯 Estado REAL para elementos interactivos
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    completedWorkouts: 0,
    totalExercises: 0,
    completedExercises: 0,
    streak: 0
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🎯 Datos de membresías
  const membresias = [
    {
      nombre: 'Básica',
      precio: '49.900',
      periodo: 'mes',
      icono: <Dumbbell size={24} />,
      color: '#667eea',
      caracteristicas: [
        'Rutina personalizada por IA',
        'Seguimiento básico',
        'Ejercicios adaptados',
        'Soporte por email',
        'App web y móvil'
      ],
      popular: false,
    },
    {
      nombre: 'Premium',
      precio: '89.900',
      periodo: 'mes',
      icono: <Crown size={24} />,
      color: '#f093fb',
      caracteristicas: [
        'Todo en Básica +',
        'Rutina semanal actualizada',
        'Video demostraciones',
        'Soporte prioritario 24/7',
        'Plan nutricional',
        'Análisis avanzado',
        'Comunidad exclusiva'
      ],
      popular: true,
    },
    {
      nombre: 'Grupal',
      precio: '69.900',
      periodo: 'mes',
      icono: <UsersIcon size={24} />,
      color: '#4facfe',
      caracteristicas: [
        'Grupos 3-5 personas',
        'Rutinas sincronizadas',
        'Desafíos grupales',
        'Sesiones virtuales',
        'Dashboard compartido',
        '30% de ahorro'
      ],
      popular: false,
    }
  ];

  // ✨ Características principales
  const features = [
    {
      icon: <Zap size={32} />,
      title: 'IA Personalizada',
      description: 'Rutinas 100% adaptadas a tus objetivos, condición física y disponibilidad',
      color: '#667eea'
    },
    {
      icon: <Target size={32} />,
      title: 'Para Todas las Capacidades',
      description: 'Programas especializados para diferentes condiciones físicas y discapacidades',
      color: '#f093fb'
    },
    {
      icon: <Clock size={32} />,
      title: 'Flexibilidad Total',
      description: 'Entrena donde y cuando quieras, sin horarios fijos ni desplazamientos',
      color: '#4facfe'
    },
    {
      icon: <Activity size={32} />,
      title: 'Seguimiento Inteligente',
      description: 'Analytics avanzados y ajustes automáticos según tu progreso',
      color: '#f5576c'
    }
  ];

  // 🏋️ Ejercicios destacados del día
  const ejerciciosDestacados = [
    { 
      nombre: 'Sentadillas Profundas', 
      musculos: 'Piernas y Glúteos', 
      duracion: '3 sets x 12 rep',
      video: true,
      color: '#667eea'
    },
    { 
      nombre: 'Push-Ups Inclinados', 
      musculos: 'Pecho y Hombros', 
      duracion: '3 sets x 10 rep',
      video: true,
      color: '#f093fb'
    },
    { 
      nombre: 'Plancha Lateral', 
      musculos: 'Core Oblicuo', 
      duracion: '3 sets x 30s',
      video: true,
      color: '#4facfe'
    }
  ];

  // 💬 Testimonios
  const testimonios = [
    { 
      nombre: 'Ana M.', 
      resultado: '-8kg en 2 meses', 
      comentario: 'La IA adaptó perfectamente mis rutinas a mi artritis',
      avatar: 'A'
    },
    { 
      nombre: 'Carlos R.', 
      resultado: '+5kg músculo', 
      comentario: 'Los videos me enseñaron la técnica correcta',
      avatar: 'C'
    },
    { 
      nombre: 'María L.', 
      resultado: 'Consistencia 100%', 
      comentario: 'Nunca me aburro con las rutinas variables',
      avatar: 'M'
    }
  ];

  // 🔄 Función para obtener datos REALES del usuario
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/profile/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const user = response.data;
      setUserData({
        id: user.id,
        email: user.email,
        name: user.nombre || user.nombre_usuario || user.name,
        role: user.role,
      });

      if (user.role !== 'usuario') {
        onLogout();
      }

      // Cargar estadísticas REALES del usuario
      await fetchUserStats();
      // Cargar rutina de hoy
      await fetchTodayWorkout();

    } catch (err) {
      console.error('Error al obtener perfil:', err);
      setError('No se pudieron cargar los datos del usuario.');
      onLogout();
    } finally {
      setLoading(false);
    }
  };

  // 📊 Función para obtener estadísticas REALES del usuario
  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/workouts/user-stats/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      
      const stats = response.data;
      setUserStats({
        totalWorkouts: stats.total_workouts || 0,
        completedWorkouts: stats.completed_workouts || 0,
        totalExercises: stats.total_exercises || 0,
        completedExercises: stats.completed_exercises || 0,
        streak: stats.current_streak || 0
      });

      setStreak(stats.current_streak || 0);
      setPoints(stats.total_points || 0);
      
      // Calcular progreso semanal REAL
      calculateWeeklyProgress(stats.weekly_progress);

    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      // Usar datos por defecto
      setUserStats({
        totalWorkouts: 0,
        completedWorkouts: 0,
        totalExercises: 0,
        completedExercises: 0,
        streak: 0
      });
    }
  };

  // 📈 Calcular progreso semanal basado en datos reales
  const calculateWeeklyProgress = (weeklyData) => {
    if (weeklyData && Array.isArray(weeklyData)) {
      setProgressData(weeklyData);
    } else {
      // Datos por defecto basados en el streak
      const defaultProgress = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => ({
        day,
        progress: index < streak ? Math.min(100, (index + 1) * 20) : 0
      }));
      setProgressData(defaultProgress);
    }
  };

  // 🏋️ Función para obtener la rutina de HOY
  const fetchTodayWorkout = async () => {
    try {
      const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
      const dayMap = {
        'lunes': 0, 'martes': 1, 'miércoles': 2, 'jueves': 3, 
        'viernes': 4, 'sábado': 5, 'domingo': 6
      };
      
      const todayIndex = dayMap[today.toLowerCase()];
      
      const response = await axios.get(`${API_URL}/api/workouts/today-workout/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const workout = response.data;
      if (workout && workout.exercises) {
        setTodayWorkout(workout);
        setCompletedExercises(workout.completed_exercises || 0);
        setTotalExercises(workout.total_exercises || workout.exercises.length);
      }

    } catch (err) {
      console.error('Error al obtener rutina de hoy:', err);
      // No establecer error, ya que el usuario podría no tener rutina para hoy
    }
  };

  // ✅ Función para marcar ejercicio como completado
  const handleCompleteExercise = async (exerciseId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/workouts/complete-exercise/`,
        {
          exercise_id: exerciseId,
          completed: true
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Actualizar estadísticas locales
        setCompletedExercises(prev => prev + 1);
        setUserStats(prev => ({
          ...prev,
          completedExercises: prev.completedExercises + 1
        }));
        
        // Mostrar notificación
        setWorkoutCompleted(true);
        setTimeout(() => setWorkoutCompleted(false), 3000);
        
        // Recargar datos actualizados
        await fetchUserStats();
        await fetchTodayWorkout();
      }
    } catch (err) {
      console.error('Error al marcar ejercicio como completado:', err);
      alert('Error al actualizar el ejercicio. Intenta nuevamente.');
    }
  };

  // ✅ Función para marcar TODO el entrenamiento como completado
  const handleCompleteWorkout = async () => {
    try {
      const response = await axios.post(
       `${API_URL}/api/workouts/complete-workout/ `,
        {
          workout_id: todayWorkout?.id,
          completed: true
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.data.success) {
        setWorkoutCompleted(true);
        setStreak(prev => prev + 1);
        setPoints(prev => prev + 50);
        
        // Recargar datos actualizados
        await fetchUserStats();
        await fetchTodayWorkout();
        
        setTimeout(() => setWorkoutCompleted(false), 3000);
      }
    } catch (err) {
      console.error('Error al completar entrenamiento:', err);
      alert('Error al completar el entrenamiento. Intenta nuevamente.');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [token, navigate, onLogout]);

  const handleLogout = () => {
    onLogout();
  };

  const handleEditarPerfil = () => {
    navigate('/editar-perfil');
  };

  const handleVerRutina = async () => {
    if (!userData?.id) {
      console.error('Usuario no identificado');
      return;
    }
    setRutinaLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/workouts/plans/usuario/${userData.id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const plan = res.data;
      
      if (plan.id || plan.plan_id || plan.rutina) {
        const planId = plan.id || plan.plan_id;
        navigate(`/mi-rutina/${planId}`);
      } else if (plan.error) {
        alert(`Error: ${plan.error}`);
      } else {
        alert('La rutina está siendo generada. Por favor, intenta en unos momentos.');
      }
    } catch (error) {
      console.error('Error completo al cargar rutina:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.error) {
          alert(`Error: ${errorData.error}`);
        } else {
          alert('Error al procesar tu solicitud. Por favor, contacta al soporte.');
        }
      } else if (error.response?.status === 404) {
        alert('No tienes una rutina asignada aún.');
      } else {
        alert('Error inesperado: ' + error.message);
      }
    } finally {
      setRutinaLoading(false);
    }
  };

  const handleShowTrainers = () => {
    setShowTrainers(true);
  };

  const handlePruebaGratis = () => {
    alert('🎉 ¡Excelente! Tu prueba de 10 días ha sido activada. ¡Comienza tu transformación ahora!');
  };

  const handleSeleccionarMembresia = (membresia) => {
    alert(`✅ ¡Perfecto! Has seleccionado ${membresia.nombre}. Serás redirigido al proceso de pago.`);
  };

  // 📊 Calcular porcentaje de completitud
  const completionPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#667eea', mb: 2 }} size={50} />
          <Typography variant="h6" color="text.secondary">
            Cargando tu espacio...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          {error}
        </Alert>
        <SecondaryButton onClick={handleLogout} fullWidth>
          Volver a Iniciar Sesión
        </SecondaryButton>
      </Container>
    );
  }

  if (showTrainers) {
    return (
      <Box sx={{ 
        p: 3, 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={() => setShowTrainers(false)} 
            sx={{ 
              background: 'white', 
              boxShadow: 2,
              mr: 2,
              '&:hover': { background: 'white' }
            }}
          >
            <ArrowLeft />
          </IconButton>
          <Typography variant="h5" fontWeight="600">
            Entrenadores Disponibles
          </Typography>
        </Box>
        <BuscarEntrenadores token={token} />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: { xs: 2, md: 3 },
    }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        
        {/* 🎯 Header Minimalista */}
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <GlassCard sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 3
            }}>
              <Box>
                <Chip 
                  label="Prueba 10 días gratis" 
                  icon={<Star size={16} />}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    mb: 2,
                    fontWeight: 600
                  }} 
                />
                <Typography variant="h4" fontWeight="700" gutterBottom>
                  Hola, {userData?.name || 'Usuario'} 👋
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500 }}>
                  {todayWorkout 
                    ? `Tu rutina de hoy: ${todayWorkout.name || 'Entrenamiento Personalizado'}`
                    : 'Tu rutina personalizada por IA está lista para comenzar'
                  }
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                width: { xs: '100%', md: 'auto' }
              }}>
                <PrimaryButton
                  onClick={handleVerRutina}
                  disabled={rutinaLoading}
                  startIcon={rutinaLoading ? <CircularProgress size={16} /> : <Play size={20} />}
                  fullWidth={isMobile}
                >
                  {rutinaLoading ? 'Cargando...' : 'Mi Rutina'}
                </PrimaryButton>
                
                <SecondaryButton
                  onClick={handleEditarPerfil}
                  startIcon={<Edit size={20} />}
                  fullWidth={isMobile}
                >
                  Editar Perfil
                </SecondaryButton>
                
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: '16px',
                    padding: '12px',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.04),
                    }
                  }}
                >
                  <LogOut size={20} />
                </IconButton>
              </Box>
            </Box>
          </GlassCard>
        </Box>

        {/* 🔔 Recordatorio Inteligente */}
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            background: alpha(theme.palette.info.main, 0.1),
            '& .MuiAlert-message': { width: '100%' }
          }}
          icon={<Bell size={20} />}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2">
              <strong>Progreso de Hoy:</strong> {completedExercises}/{totalExercises} ejercicios completados
            </Typography>
            {completionPercentage === 100 ? (
              <Chip label="¡Rutina Completada! 🎉" color="success" variant="filled" />
            ) : (
              <Button 
                size="small" 
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600
                }}
                onClick={handleCompleteWorkout}
              >
                Completar Todo
              </Button>
            )}
          </Box>
        </Alert>

        {/* 🚀 Sección Principal - Rutina del Día y Métricas */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {/* Rutina del Día Destacada */}
          <Grid item xs={12} lg={8}>
            <GlassCard sx={{ 
              background: todayWorkout 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Zap size={24} style={{ marginRight: 12 }} />
                  <Typography variant="h6" fontWeight="600">
                    {todayWorkout ? 'Rutina de Hoy' : 'Sin Rutina para Hoy'}
                  </Typography>
                </Box>
                
                <Typography variant="h5" fontWeight="700" gutterBottom>
                  {todayWorkout 
                    ? todayWorkout.name || 'Entrenamiento Personalizado'
                    : 'Descansa o programa nuevo entrenamiento'
                  }
                </Typography>
                
                {todayWorkout && (
                  <>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${totalExercises} ejercicios`} 
                        variant="outlined" 
                        sx={{ color: 'white', borderColor: 'white' }} 
                      />
                      <Chip 
                        label={`${completedExercises} completados`} 
                        variant="outlined" 
                        sx={{ 
                          color: 'white', 
                          borderColor: 'white',
                          background: completionPercentage === 100 ? alpha('#4CAF50', 0.3) : 'transparent'
                        }} 
                      />
                      <Chip 
                        label={`${completionPercentage}% completado`} 
                        variant="outlined" 
                        sx={{ color: 'white', borderColor: 'white' }} 
                      />
                    </Box>

                    {/* Barra de progreso */}
                    <Box sx={{ mb: 3 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={completionPercentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha('#fff', 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#4CAF50',
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>

                    {/* Ejercicios de hoy */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                        Ejercicios de Hoy:
                      </Typography>
                      <Grid container spacing={1}>
                        {todayWorkout.exercises && todayWorkout.exercises.slice(0, 6).map((exercise, index) => (
                          <Grid item xs={6} sm={4} key={exercise.id || index}>
                            <Box sx={{
                              background: alpha('#fff', 0.2),
                              borderRadius: '12px',
                              padding: '8px 12px',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              {exercise.completed ? (
                                <CheckCircle size={16} color="#4CAF50" />
                              ) : (
                                <Dumbbell size={16} />
                              )}
                              {exercise.name}
                            </Box>
                          </Grid>
                        ))}
                        {todayWorkout.exercises && todayWorkout.exercises.length > 6 && (
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              +{todayWorkout.exercises.length - 6} ejercicios más...
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <PrimaryButton 
                        onClick={handleVerRutina}
                        sx={{ 
                          background: 'white', 
                          color: '#667eea',
                          '&:hover': { background: alpha('#fff', 0.9) }
                        }}
                        fullWidth={isMobile}
                      >
                        Comenzar Entrenamiento
                      </PrimaryButton>
                      {completionPercentage < 100 && (
                        <SecondaryButton 
                          onClick={handleCompleteWorkout}
                          sx={{ 
                            borderColor: 'white', 
                            color: 'white',
                            '&:hover': { background: alpha('#fff', 0.1) }
                          }}
                          fullWidth={isMobile}
                        >
                          Marcar como Completado
                        </SecondaryButton>
                      )}
                    </Box>
                  </>
                )}
                
                {!todayWorkout && (
                  <PrimaryButton 
                    onClick={handleVerRutina}
                    sx={{ 
                      background: 'white', 
                      color: '#95a5a6',
                      '&:hover': { background: alpha('#fff', 0.9) }
                    }}
                    fullWidth
                  >
                    Generar Nueva Rutina
                  </PrimaryButton>
                )}
              </CardContent>
            </GlassCard>

            {/* Ejercicios Destacados con Video Preview */}
            <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mt: 4, mb: 3 }}>
              Ejercicios Destacados
            </Typography>
            
            <Grid container spacing={2}>
              {ejerciciosDestacados.map((ejercicio, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <GlassCard sx={{ cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        width: '100%', 
                        height: 120, 
                        background: `linear-gradient(135deg, ${ejercicio.color}20 0%, ${ejercicio.color}10 100%)`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        position: 'relative'
                      }}>
                        <Play size={32} color={ejercicio.color} />
                        {ejercicio.video && (
                          <Chip 
                            label="Video" 
                            size="small"
                            sx={{ 
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: ejercicio.color,
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        {ejercicio.nombre}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {ejercicio.musculos}
                      </Typography>
                      
                      <Typography variant="body2" fontWeight="500">
                        {ejercicio.duracion}
                      </Typography>
                    </CardContent>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Sidebar - Métricas y Progreso */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              {/* Racha y Puntos */}
              <Grid item xs={12}>
                <GlassCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="600">
                        Tu Racha
                      </Typography>
                      <Chip 
                        label={`${streak} días ${streak > 0 ? '🔥' : '😴'}`} 
                        color={streak > 0 ? "primary" : "default"}
                        variant="outlined" 
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      {[...Array(7)].map((_, index) => (
                        <Box key={index} sx={{
                          flex: 1,
                          height: '8px',
                          background: index < streak 
                            ? 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)'
                            : alpha(theme.palette.primary.main, 0.1),
                          borderRadius: '4px'
                        }}/>
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Puntos acumulados
                        </Typography>
                        <Typography variant="h6" fontWeight="600">
                          {points} pts
                        </Typography>
                      </Box>
                      <Chip 
                        icon={<Award size={16} />}
                        label={`Nivel ${Math.floor(points / 100) + 1}`} 
                        variant="outlined" 
                      />
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>

              {/* Progreso Semanal */}
              <Grid item xs={12}>
                <GlassCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <TrendingUp size={20} style={{ marginRight: 8 }} color="#667eea" />
                      <Typography variant="h6" fontWeight="600">
                        Progreso Semanal
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, mb: 3, height: 80 }}>
                      {progressData.map((item, index) => (
                        <Box key={index} sx={{ textAlign: 'center', flex: 1 }}>
                          <Box
                            sx={{
                              height: `${item.progress}%`,
                              maxHeight: '60px',
                              minHeight: '10px',
                              background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                              borderRadius: '8px 8px 4px 4px',
                              marginBottom: 1,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {item.day}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                        {Math.round(progressData.reduce((sum, day) => sum + day.progress, 0) / 7)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Promedio semanal
                      </Typography>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>

              {/* Estadísticas Generales */}
              <Grid item xs={12}>
                <GlassCard>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <FeatureIcon color="#ff6b6b" sx={{ mx: 'auto' }}>
                      <Activity size={32} />
                    </FeatureIcon>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      Tus Estadísticas
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="h4" fontWeight="700" color="#667eea">
                          {userStats.completedWorkouts}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Entrenamientos
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h4" fontWeight="700" color="#f093fb">
                          {userStats.completedExercises}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ejercicios
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {completionPercentage === 100 
                        ? '¡Excelente trabajo hoy! 🎉'
                        : '¡Sigue así! 💪'
                      }
                    </Typography>
                  </CardContent>
                </GlassCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* ✨ Características Principales */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="700" textAlign="center" color='black' gutterBottom sx={{ mb: 1 }}>
            Entrenamiento Inteligente
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            La potencia de la IA al servicio de tu transformación física
          </Typography>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <FeatureIcon color={feature.color} sx={{ mx: 'auto' }}>
                      {feature.icon}
                    </FeatureIcon>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 💬 Testimonios */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="700" textAlign="center" gutterBottom sx={{ mb: 4 }}>
            Lo Que Dicen Nuestros Usuarios
          </Typography>
          
          <Grid container spacing={3}>
            {testimonios.map((testimonio, index) => (
              <Grid item xs={12} md={4} key={index}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${features[index].color} 0%, ${alpha(features[index].color, 0.7)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1.25rem'
                    }}>
                      {testimonio.avatar}
                    </Box>
                    
                    <Typography variant="h6" fontWeight="600" gutterBottom color={features[index].color}>
                      {testimonio.resultado}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', minHeight: 60 }}>
                      "{testimonio.comentario}"
                    </Typography>
                    
                    <Typography variant="body2" fontWeight="600">
                      {testimonio.nombre}
                    </Typography>
                  </CardContent>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 💎 Planes de Membresía */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="700" textAlign="center" color='black' gutterBottom sx={{ mb: 1 }}>
            Elige Tu Plan Ideal
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Precios en pesos colombianos
          </Typography>

          <Grid container spacing={3} alignItems="center" justifyContent="center">
            {membresias.map((membresia, index) => (
              <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
                <MembershipCard isFeatured={membresia.popular} sx={{ flex: 1 }}>
                  <CardContent sx={{ p: 0 }}>
                    {membresia.popular && (
                      <Chip 
                        label="Más Popular" 
                        size="small"
                        sx={{ 
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: `linear-gradient(135deg, ${membresia.color} 0%, ${alpha(membresia.color, 0.7)} 100%)`,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }} 
                      />
                    )}
                    
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: '16px',
                          background: `linear-gradient(135deg, ${membresia.color}20 0%, ${membresia.color}10 100%)`,
                          color: membresia.color,
                          mb: 2,
                        }}
                      >
                        {membresia.icono}
                      </Box>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        {membresia.nombre}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h4" fontWeight="700" gutterBottom>
                        ${membresia.precio}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        COP / {membresia.periodo}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      {membresia.caracteristicas.map((caracteristica, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Check size={16} color={membresia.color} style={{ marginRight: 8 }} />
                          <Typography variant="body2" color="text.secondary">
                            {caracteristica}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 0 }}>
                    <PrimaryButton 
                      onClick={() => handleSeleccionarMembresia(membresia)}
                      fullWidth
                      sx={{ borderRadius: '12px' }}
                    >
                      Comenzar
                    </PrimaryButton>
                  </CardActions>
                </MembershipCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 🎉 Llamada a la Acción */}
        <GlassCard sx={{ textAlign: 'center', p: { xs: 4, md: 6 } }}>
          <Sparkles size={48} color="#667eea" style={{ margin: '0 auto 24px' }} />
          <Typography variant="h5" fontWeight="700" gutterBottom>
            ¿Listo para Transformarte?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            Únete a miles de personas que ya están logrando sus objetivos con entrenamiento inteligente
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton onClick={handlePruebaGratis} size="large">
              Probar 10 Días Gratis
            </PrimaryButton>
            <SecondaryButton size="large">
              Ver Todos los Planes
            </SecondaryButton>
          </Box>
        </GlassCard>

        {/* ✅ Notificación de entrenamiento completado */}
        {workoutCompleted && (
          <Box sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
          }}>
            <GlassCard sx={{ 
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              p: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Award size={24} />
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    ¡Entrenamiento Completado!
                  </Typography>
                  <Typography variant="body2">
                    +50 puntos • Racha: {streak} días
                  </Typography>
                </Box>
              </Box>
            </GlassCard>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default UserDashboardPage;