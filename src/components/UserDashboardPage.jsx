import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const UserDashboardPage = ({ onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/profile/', {
          headers: { Authorization: `Token ${token}` }
        });

        const user = response.data;
        console.log('Datos usuario:', user);

        setUserData({
          email: user.email,
          name: user.nombre || user.nombre_usuario || user.name,
          role: user.role,
        });

        if (user.role !== 'usuario') {
          // Si no es usuario, redirigir fuera (opcional)
          navigate('/login');
        }

      } catch (err) {
        console.error('Error al obtener perfil:', err);
        setError('No se pudieron cargar los datos del usuario.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    onLogout();
    navigate('/login');
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
        <Typography variant="h6">
          Tu rol es: {userData?.role}
        </Typography>
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

      {/* Opciones para usuario */}
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
              <Button size="small" onClick={() => navigate('/mi-rutina')}>
                Ver Rutina
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboardPage;


