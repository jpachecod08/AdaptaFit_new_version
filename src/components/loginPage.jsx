import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }) => {
  const [role, setRole] = useState('usuario');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [redirectMessage, setRedirectMessage] = useState('');
  const [autoLogged, setAutoLogged] = useState(false); // Flag para evitar bucle
  const navigate = useNavigate();

  useEffect(() => {
    if (autoLogged) return;

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token && userRole) {
      onLogin(token, userRole);

      setRedirectMessage('Redirigiendo...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);

      setAutoLogged(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [autoLogged, navigate, onLogin]);

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) setRole(newRole);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const payload = {
      username: email,  // o 'email' si backend lo acepta
      password: password,
    };

    const response = await axios.post('http://localhost:8000/api/login/', payload);
    console.log("Login response completa:", response.data);

    const token = response.data.token || response.data.authToken || response.data.accessToken;
    // Aquí toma el tipo_usuario enviado por backend o el rol seleccionado en el frontend
    const tipo_usuario = response.data.tipo_usuario || role; 

    if (!token) {
      throw new Error('Faltan datos esenciales de autenticación');
    }

    // Forzar que solo acepte 'usuario' o 'entrenador', si no, pone 'usuario' por defecto
    const rolValido = (tipo_usuario === 'usuario' || tipo_usuario === 'entrenador') 
      ? tipo_usuario 
      : 'usuario';

    // Guarda todos los tokens relevantes
    localStorage.setItem('authToken', token);
    if(response.data.refreshToken) localStorage.setItem('refreshToken', response.data.refreshToken);
    if(response.data.accessToken) localStorage.setItem('accessToken', response.data.accessToken);

    // Guarda info usuario
    if(response.data.tipo_usuario) localStorage.setItem('tipo_usuario', response.data.tipo_usuario);
    if(response.data.roles) localStorage.setItem('roles', JSON.stringify(response.data.roles));
    if(response.data.userData) localStorage.setItem('userData', JSON.stringify(response.data.userData));

    // Guarda rol validado en localStorage
    localStorage.setItem('userRole', rolValido);

    // Usa rol validado en el onLogin
    onLogin(token, rolValido);

    setSnackbarMessage('Inicio de sesión exitoso');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);

    setTimeout(() => {
      if (rolValido === 'usuario' || rolValido === 'entrenador') {
        navigate('/dashboard'); // Ambos van a la misma ruta, el dashboard decide qué mostrar según rol
      } else {
        navigate('/login'); // Rol inválido, redirige a login
      }
    }, 1000);

  } catch (error) {
    console.error('Error de login:', error);
    const errorMessage =
      error.response?.data?.non_field_errors?.[0] || 'Usuario o contraseña incorrectos.';
    setSnackbarMessage(errorMessage);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};


  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Box display="flex" justifyContent="center" mb={3}>
            <img src="/AdaptaFitLogo.png" alt="AdaptaFit Logo" style={{ width: 100 }} />
          </Box>

          <Typography variant="h5" textAlign="center" fontWeight="bold" color="#00838F" mb={2}>
            Iniciar Sesión
          </Typography>

          <ToggleButtonGroup
            value={role}
            exclusive
            onChange={handleRoleChange}
            fullWidth
            sx={{ mb: 3 }}
          >
            <ToggleButton value="usuario" sx={{ textTransform: 'none' }}>Usuario</ToggleButton>
            <ToggleButton value="entrenador" sx={{ textTransform: 'none' }}>Entrenador</ToggleButton>
          </ToggleButtonGroup>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Correo Electrónico"
              variant="outlined"
              fullWidth
              margin="normal"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{
                sx: {
                  transform: 'translate(14px, 10px) scale(1)',
                  '&.Mui-focused': { transform: 'translate(14px, -9px) scale(0.75)' },
                  '&.MuiFormLabel-filled': { transform: 'translate(14px, -9px) scale(0.75)' },
                },
              }}
              InputProps={{ sx: { padding: '12.5px 14px' } }}
            />

            <TextField
              label="Contraseña"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{
                sx: {
                  transform: 'translate(14px, 10px) scale(1)',
                  '&.Mui-focused': { transform: 'translate(14px, -9px) scale(0.75)' },
                  '&.MuiFormLabel-filled': { transform: 'translate(14px, -9px) scale(0.75)' },
                },
              }}
              InputProps={{ sx: { padding: '12.5px 14px' } }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                mb: 2,
                backgroundColor: '#00838F',
                '&:hover': { backgroundColor: '#006064' }
              }}
              disabled={loading}
            >
              {loading ? 'Cargando...' : `Ingresar como ${role === 'usuario' ? 'Usuario' : 'Entrenador'}`}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center">
  ¿No tienes una cuenta?{' '}
  <MuiLink component={Link} to="/register" sx={{ color: '#00838F', fontWeight: 'bold' }}>
    Regístrate aquí
  </MuiLink>
</Typography>
        </Paper>

        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage || redirectMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default LoginPage;
