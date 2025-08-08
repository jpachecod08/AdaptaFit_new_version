import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link as MuiLink } from '@mui/material';
import axios from 'axios';

const RegisterPage = () => {
  const [role, setRole] = useState('usuario');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    fechaNacimiento: '',
    genero: '',
    altura: '',
    peso: '',
    objetivo: '',
    experiencia: '',
    frecuencia: '',
    lesiones: '',
    especialidad: '',
    anosExperiencia: '',
    certificaciones: '',
    biografia: '',
    telefono: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
      setFormData({
        ...formData,
        fechaNacimiento: '',
        genero: '',
        altura: '',
        peso: '',
        objetivo: '',
        experiencia: '',
        frecuencia: '',
        lesiones: '',
        especialidad: '',
        anosExperiencia: '',
        certificaciones: '',
        biografia: '',
        telefono: '',
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  try {
    // ----------------------------------------------------------------------
    // CÓDIGO CORREGIDO
    // Construye la URL de la API de registro de forma condicional,
    // usando 'user' o 'trainer' para que coincida con las rutas del backend.
    // ----------------------------------------------------------------------
    const apiEndpointBase = 'http://localhost:8000/api/register/';
    const registerUrl = role === 'usuario' ? `${apiEndpointBase}user/` : `${apiEndpointBase}trainer/`;

    const response = await axios.post(registerUrl, formData);

    if (response.status === 201) {
      setSuccess(true);
      setSnackbarSeverity('success');
      setSnackbarMessage('¡Registro exitoso! Redirigiendo...');
      setSnackbarOpen(true);
    }
  } catch (err) {
    console.error('Error durante el registro:', err);
    let errorMessage = 'Error de conexión. Inténtalo de nuevo.';
    if (err.response) {
      // El servidor respondió con un status code fuera del rango 2xx
      if (err.response.data.email) {
        errorMessage = err.response.data.email[0];
      } else if (err.response.data.password) {
        errorMessage = err.response.data.password[0];
      } else if (err.response.data.non_field_errors) {
        errorMessage = err.response.data.non_field_errors[0];
      } else {
        errorMessage = 'Ocurrió un error al procesar el registro.';
      }
    }
    setSnackbarSeverity('error');
    setSnackbarMessage(errorMessage);
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};

  const snackbarAction = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={handleCloseSnackbar}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ p: 4, mt: 5, borderRadius: 3 }}>
        <Typography variant="h5" textAlign="center" fontWeight="bold" color="#00838F" mb={3}>
          Registro
        </Typography>

        <ToggleButtonGroup
          value={role}
          exclusive
          onChange={handleRoleChange}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="usuario" sx={{ textTransform: 'none' }}>Registrar como Usuario</ToggleButton>
          <ToggleButton value="entrenador" sx={{ textTransform: 'none' }}>Registrar como Entrenador</ToggleButton>
        </ToggleButtonGroup>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h6" mt={2} mb={1}>Datos de Cuenta</Typography>
          <TextField
            label="Nombre Completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            margin="normal"
            autoComplete="off"
          />
          <TextField
            label="Correo Electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            autoComplete="off"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            autoComplete="new-password"
            InputLabelProps={{ shrink: true }}
          />

          {role === 'usuario' ? (
            <Box>
              <Typography variant="h6" mt={4} mb={1}>Datos para tu Plan de Entrenamiento</Typography>
              <TextField
                label="Fecha de Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                autoComplete="off"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Género</InputLabel>
                <Select name="genero" value={formData.genero} onChange={handleChange}>
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Altura (cm)"
                name="altura"
                type="number"
                value={formData.altura}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <TextField
                label="Peso (kg)"
                name="peso"
                type="number"
                value={formData.peso}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Objetivo Principal</InputLabel>
                <Select name="objetivo" value={formData.objetivo} onChange={handleChange}>
                  <MenuItem value="perder_peso">Perder peso</MenuItem>
                  <MenuItem value="ganar_musculo">Ganar masa muscular</MenuItem>
                  <MenuItem value="mantenerse">Mantenerse en forma</MenuItem>
                  <MenuItem value="resistencia">Mejorar la resistencia</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Nivel de Experiencia</InputLabel>
                <Select name="experiencia" value={formData.experiencia} onChange={handleChange}>
                  <MenuItem value="principiante">Principiante</MenuItem>
                  <MenuItem value="intermedio">Intermedio</MenuItem>
                  <MenuItem value="avanzado">Avanzado</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Frecuencia de Entrenamiento (días/semana)"
                name="frecuencia"
                type="number"
                value={formData.frecuencia}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <TextField
                label="Lesiones o limitaciones (opcional)"
                name="lesiones"
                value={formData.lesiones}
                onChange={handleChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
                autoComplete="off"
              />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" mt={4} mb={1}>Datos Profesionales del Entrenador</Typography>
              <TextField
                label="Especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <TextField
                label="Años de Experiencia"
                name="anosExperiencia"
                type="number"
                value={formData.anosExperiencia}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <TextField
                label="Certificaciones"
                name="certificaciones"
                value={formData.certificaciones}
                onChange={handleChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
                autoComplete="off"
              />
              <TextField
                label="Biografía (Breve descripción)"
                name="biografia"
                value={formData.biografia}
                onChange={handleChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                autoComplete="off"
              />
              <TextField
                label="Número de Teléfono (opcional)"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              backgroundColor: '#00838F',
              '&:hover': { backgroundColor: '#006064' }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : `Registrarse como ${role === 'usuario' ? 'Usuario' : 'Entrenador'}`}
          </Button>

          <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/" style={{ textDecoration: 'none' }}>
              <MuiLink component="span" sx={{ color: '#00838F', fontWeight: 'bold' }}>
                Inicia sesión aquí
              </MuiLink>
            </Link>
          </Typography>
        </Box>
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
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RegisterPage;
