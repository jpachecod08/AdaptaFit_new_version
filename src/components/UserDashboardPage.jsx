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
} from '@mui/material';
import axios from 'axios';
// import {
//   Users,
//   Dumbbell,
//   LineChart as LineChartIcon,
//   LogOut,
//   ArrowLeft,
// } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// --- Importa el componente BuscarEntrenadores aquí ---
import BuscarEntrenadores from './BuscarEntrenadores';

const StyledButton = styled(Button)(({ theme, colorName }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: '12px 24px',
  fontWeight: 'bold',
  textTransform: 'none',
  fontSize: '1rem',
  color: 'white',
  boxShadow: `0 4px 15px rgba(0, 131, 143, 0.4)`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px rgba(0, 131, 143, 0.6)`,
  },
  ...(colorName === 'trainers' && {
    background: `linear-gradient(45deg, #00838F 30%, #006064 90%)`,
    '&:hover': {
      background: `linear-gradient(45deg, #006064 30%, #004d40 90%)`,
    },
  }),
  ...(colorName === 'routine' && {
    background: `linear-gradient(45deg, #FFD700 30%, #FFA500 90%)`,
    '&:hover': {
      background: `linear-gradient(45deg, #FFA500 30%, #FF8C00 90%)`,
    },
  }),
}));

const UserDashboardPage = ({ token, onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rutinaLoading, setRutinaLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  // --- Nuevo estado para controlar la vista de entrenadores ---
  const [showTrainers, setShowTrainers] = useState(false);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/profile/', {
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
    } catch (err) {
      console.error('Error al obtener perfil:', err);
      setError('No se pudieron cargar los datos del usuario.');
      onLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const newData = months.map((month) => ({
      name: month,
      resultados: Math.floor(Math.random() * 5000) + 2000,
    }));
    setChartData(newData);
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [token, navigate, onLogout]);

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    onLogout();
  };

  const handleVerRutina = async () => {
    if (!userData?.id) {
      console.error('Usuario no identificado');
      return;
    }
    setRutinaLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/workouts/plans/usuario/${userData.id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const plan = res.data;
      if (!plan.id) {
        console.warn('No se encontró rutina para este usuario.');
        return;
      }
      navigate(`/mi-rutina/${plan.id}`);
    } catch (error) {
      console.error('Error al cargar rutina:', error);
      if (error.response?.status === 404) {
        alert('No tienes una rutina asignada aún.');
      } else {
        alert('Ocurrió un error al cargar la rutina.');
      }
    } finally {
      setRutinaLoading(false);
    }
  };
  
  // --- Función para navegar a la vista de entrenadores ---
  const handleShowTrainers = () => {
    setShowTrainers(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8' }}>
        <CircularProgress sx={{ color: '#00838F' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={handleLogout} sx={{ mt: 2 }}>
          Volver a Iniciar Sesión
        </Button>
      </Container>
    );
  }

  // --- Renderizado condicional del componente BuscarEntrenadores ---
  if (showTrainers) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => setShowTrainers(false)} color="primary">
            <ArrowLeft />
          </IconButton>
          <Typography variant="h5" sx={{ ml: 2, fontWeight: 'bold' }}>
            Buscar Entrenadores
          </Typography>
        </Box>
        <BuscarEntrenadores token={token} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        py: { xs: 3, md: 6 },
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 6 },
            mb: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #00838F 30%, #004d40 90%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 70%)',
              animation: 'pulse-bg 20s infinite',
              '@keyframes pulse-bg': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.2)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, zIndex: 1, position: 'relative' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                ¡Hola, {userData?.name || 'Usuario'}!
              </Typography>
              <Typography variant="h6">Tu viaje al fitness comienza aquí. ¿Estás listo para entrenar?</Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                },
                boxShadow: 'none',
                borderRadius: 2,
                px: 2,
                py: 1,
              }}
              startIcon={<LogOut />}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Paper>

        <Grid container spacing={5}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pr: { md: 5 } }}>
              <Card elevation={4} sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Users size={32} color="#00838F" />
                    <Typography variant="h6" fontWeight="bold" sx={{ ml: 2 }}>
                      Encuentra tu Entrenador Ideal
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Conéctate con expertos que te guiarán en cada paso de tu camino. Explora perfiles, especialidades y solicita la conexión que necesitas.
                  </Typography>
                </CardContent>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <StyledButton colorName="trainers" onClick={handleShowTrainers} startIcon={<Users />}>
                    Buscar Entrenadores
                  </StyledButton>
                </Box>
              </Card>

              <Card elevation={4} sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Dumbbell size={32} color="#00838F" />
                    <Typography variant="h6" fontWeight="bold" sx={{ ml: 2 }}>
                      Tu Rutina Personalizada
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Tu plan de entrenamiento te espera. Revísalo, síguelo y lleva un registro de tu progreso para alcanzar tus metas.
                  </Typography>
                </CardContent>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <StyledButton colorName="routine" onClick={handleVerRutina} disabled={rutinaLoading} startIcon={<Dumbbell />}>
                    {rutinaLoading ? 'Cargando...' : 'Ver Mi Rutina'}
                  </StyledButton>
                </Box>
              </Card>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Card elevation={8} sx={{ borderRadius: 4, p: { xs: 2, md: 4 }, minHeight: '300px' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LineChartIcon size={32} color="#00838F" />
                    <Typography variant="h6" fontWeight="bold" sx={{ ml: 2 }}>
                      Resultados de la Comunidad
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Estadísticas de usuarios y resultados positivos a lo largo del tiempo.
                  </Typography>
                  <Box sx={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="resultados" stroke="#00838F" activeDot={{ r: 8 }} name="Resultados Positivos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              <Paper
                elevation={8}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: { xs: '200px', md: '180px' },
                  background: `linear-gradient(225deg, #00838F 20%, #4db6ac 80%)`,
                  borderRadius: 4,
                  p: { xs: 3, md: 4 },
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    width: '150%',
                    height: '150%',
                    top: '-25%',
                    left: '-25%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 60%)',
                    animation: 'rotate-bg 30s linear infinite',
                    '@keyframes rotate-bg': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <Dumbbell size={80} style={{ zIndex: 1, marginBottom: '1rem' }} />
                <Typography variant="h5" fontWeight="bold" textAlign="center" sx={{ mb: 1, zIndex: 1 }}>
                  ¡Elige el camino hacia tu mejor versión!
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ zIndex: 1 }}>
                  Ya sea con la guía de un experto o siguiendo tu propio plan, cada paso te acerca a tus objetivos de bienestar. ¡Vamos!
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default UserDashboardPage;