import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Link as MuiLink, // Renombramos Link de Material-UI
} from '@mui/material';
import { Link } from 'react-router-dom'; // Importamos el Link de React Router

const LoginPage = () => {
  const [role, setRole] = useState('usuario');

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  return (
    // Agrega este Box para centrar todo el contenido de la página
    <Box
      sx={{
        minHeight: '100vh', // Ocupa el 100% de la altura de la ventana
        display: 'flex',
        justifyContent: 'center', // Centra horizontalmente
        alignItems: 'center', // Centra verticalmente
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          {/* Logo */}
          <Box display="flex" justifyContent="center" mb={3}>
            <img src="/AdaptaFitLogo.png" alt="AdaptaFit Logo" style={{ width: 100 }} />
          </Box>

          {/* Título */}
          <Typography variant="h5" textAlign="center" fontWeight="bold" color="#00838F" mb={2}>
            Iniciar Sesión
          </Typography>

          {/* Selector de rol */}
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

          {/* Formulario */}
          <TextField
            label="Correo Electrónico"
            variant="outlined"
            fullWidth
            margin="normal"
            autoComplete="off"
            InputLabelProps={{
              sx: {
                transform: 'translate(14px, 10px) scale(1)',
                '&.Mui-focused': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
                '&.MuiFormLabel-filled': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
              },
            }}
            InputProps={{
              sx: {
                padding: '12.5px 14px',
              },
            }}
          />
          
          <TextField
            label="Contraseña"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            autoComplete="new-password"
            InputLabelProps={{
              sx: {
                transform: 'translate(14px, 10px) scale(1)',
                '&.Mui-focused': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
                '&.MuiFormLabel-filled': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
              },
            }}
            InputProps={{
              sx: {
                padding: '12.5px 14px',
              },
            }}
          />

          {/* Botón */}
          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              mb: 2,
              backgroundColor: '#00838F',
              '&:hover': { backgroundColor: '#006064' }
            }}
          >
            Ingresar como {role === 'usuario' ? 'Usuario' : 'Entrenador'}
          </Button>

          {/* Enlace para registrarse */}
          <Typography variant="body2" textAlign="center">
            ¿No tienes una cuenta?{' '}
            <Link to="/registro" style={{ textDecoration: 'none' }}>
                <MuiLink component="span" sx={{ color: '#00838F', fontWeight: 'bold' }}>
                    Regístrate aquí
                </MuiLink>
            </Link>
          </Typography>

        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;