import React, { useState, useEffect } from 'react';
import API from './../api/api'; // Asegúrate que la ruta de importación es correcta
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
  CardActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UserDashboardPage = ({ token, onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rutinaLoading, setRutinaLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        // CORRECTO: ruta completa con 'users'
        const response = await API.get('users/profile/');

        const user = response.data;
        console.log('Datos usuario:', user);

        setUserData({
          id: user.id,
          email: user.email,
          name: user.nombre || user.nombre_usuario || user.name,
          role: user.role,
        });

        if (user.role !== 'usuario') {
          navigate('/login');
        }
      } catch (err) {
        console.error('Error al obtener perfil:', err);
        setError('No se pudieron cargar los datos del usuario.');
        onLogout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate, onLogout]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleVerRutina = async () => {
    if (!userData?.id) {
        alert('Usuario no identificado');
        return;
    }
    setRutinaLoading(true);
    try {
        // Obtener el token del localStorage
        const token = localStorage.getItem('authToken');

        // Verificar si el token existe
        if (!token) {
            alert('No se encontró el token de autenticación');
            setRutinaLoading(false);
            onLogout();
            return;
        }

        // CORRECTO: Llamas a la ruta y pasas el token en los headers
        const res = await API.get(`workouts/plans/usuario/${userData.id}/`, {
            headers: {
                Authorization: `Token ${token}`
            }
        });

        const plan = res.data;
        if (!plan.id) {
            alert('No se encontró rutina para este usuario.');
            return;
        }
        navigate(`/mi-rutina/${plan.id}`);
    } catch (error) {
        console.error('Error al cargar rutina:', error);
        alert('No se pudo cargar la rutina');
    } finally {
        setRutinaLoading(false);
    }
};

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, backgroundColor: '#00838F', color: 'white', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ¡Bienvenido, {userData?.name || 'Usuario'}!
        </Typography>
        <Typography variant="h6">Tu rol es: {userData?.role}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          {userData?.email}
        </Typography>
        <Button
          variant="contained"
          onClick={handleLogout}
          sx={{ mt: 3, backgroundColor: 'white', color: '#00838F', '&:hover': { backgroundColor: '#f0f0f0' } }}
        >
          Cerrar Sesión
        </Button>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conectar con un entrenador
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Busca entrenadores disponibles y solicita conexión para recibir asesoría personalizada.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/conectar-entrenador')}>
                Ir a Entrenadores
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mi rutina de entrenamiento
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consulta tu rutina personalizada según los datos que ingresaste en el registro.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={handleVerRutina} disabled={rutinaLoading}>
                {rutinaLoading ? 'Cargando...' : 'Ver Rutina'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboardPage;




