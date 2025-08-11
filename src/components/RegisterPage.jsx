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
    // Campos del usuario (se mantienen en el estado)
    fechaNacimiento: '',
    genero: '',
    altura: '',
    peso: '',
    objetivo: '',
    experiencia: '',
    frecuencia: '',
    lesiones: '',
    // Campos del entrenador (se mantienen en el estado)
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
        // En un entorno de aplicación real, esta línea funcionaría.
        navigate('/');
        console.log('Registro exitoso. Redireccionando a la página de inicio.');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
      // Limpiar los datos del rol anterior para evitar enviar datos no deseados
      setFormData({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
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
      const apiEndpointBase = 'http://localhost:8000/api/users/register/';
      let registerUrl = '';
      let payload = {};

      // Construir el payload de manera condicional según el rol
      if (role === 'usuario') {
        registerUrl = `${apiEndpointBase}user/`;
        payload = {
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          user_profile: {
            fechaNacimiento: formData.fechaNacimiento,
            genero: formData.genero,
            altura: formData.altura,
            peso: formData.peso,
            objetivo: formData.objetivo,
            experiencia: formData.experiencia,
            frecuencia: formData.frecuencia,
            lesiones: formData.lesiones,
          },
        };
      } else {
        registerUrl = `${apiEndpointBase}trainer/`;
        payload = {
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          trainer_profile: {
            especialidad: formData.especialidad,
            anosExperiencia: formData.anosExperiencia,
            certificaciones: formData.certificaciones,
            biografia: formData.biografia,
            telefono: formData.telefono,
          },
        };
      }

      // Enviar el payload correcto al endpoint correcto
      const response = await axios.post(registerUrl, payload);

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
        if (err.response.data.email) {
          errorMessage = err.response.data.email[0];
        } else if (err.response.data.password) {
          errorMessage = err.response.data.password[0];
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else if (err.response.data.trainer_profile) {
            errorMessage = `Error en el perfil del entrenador: ${JSON.stringify(err.response.data.trainer_profile)}`;
        } else if (err.response.data.user_profile) {
            errorMessage = `Error en el perfil del usuario: ${JSON.stringify(err.response.data.user_profile)}`;
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
    // Contenedor principal. Se permite el scroll en toda la página
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        fontFamily: 'Roboto, sans-serif',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Lado izquierdo: Formulario de registro. */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          pt: { xs: 4, md: 2 },
          pb: { xs: 4, md: 2 },
          backgroundColor: '#ffffff',
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3, bgcolor: '#ffffff' }}>
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
              <ToggleButton value="usuario" sx={{ textTransform: 'none', color: '#00838F' }}>
                Registrar como Usuario
              </ToggleButton>
              <ToggleButton value="entrenador" sx={{ textTransform: 'none', color: '#00838F' }}>
                Registrar como Entrenador
              </ToggleButton>
            </ToggleButtonGroup>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Typography variant="h6" mt={2} mb={1} color="#333">
                Datos de Cuenta
              </Typography>
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
                  <Typography variant="h6" mt={4} mb={1} color="#333">
                    Datos para tu Plan de Entrenamiento
                  </Typography>
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
                  <Typography variant="h6" mt={4} mb={1} color="#333">
                    Datos Profesionales del Entrenador
                  </Typography>
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
        </Container>

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
      </Box>

      {/* Lado derecho: Animación del gimnasio. El mensaje es ahora 'sticky'. */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'block' },
          position: { md: 'relative' },
          backgroundColor: '#00838F', // Color de fondo principal azul
          minHeight: { xs: '30vh', md: '100vh' },
          color: 'white',
          p: 4,
          '&::before': { // Se utiliza un pseudo-elemento para la imagen de fondo
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1549060284-5696d0774640?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4, // Opacidad de la imagen
          },
          '@keyframes lift-animation': {
            '0%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-20px)' },
            '100%': { transform: 'translateY(0)' },
          },
        }}
      >
        <Box
          sx={{
            zIndex: 1,
            textAlign: 'center',
            position: 'sticky',
            top: 20, // El mensaje se "pegará" a 20px de la parte superior del viewport
          }}
        >
          {/* Animación de la pesa */}
          <Box
            sx={{
              width: 80,
              height: 40,
              bgcolor: '#006064',
              borderRadius: '10px 10px 5px 5px',
              position: 'relative',
              display: 'inline-block',
              animation: 'lift-animation 2s ease-in-out infinite',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 20,
                height: 60,
                bgcolor: '#004d40',
                borderRadius: 2,
              },
              '&::before': { left: -20 },
              '&::after': { right: -20 },
            }}
          />
          
          <Typography variant="h3" fontWeight="bold" gutterBottom mt={5}>
            Crea tu rutina perfecta
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 400, mx: 'auto' }}>
            Transforma tu vida, encuentra tu entrenador ideal y alcanza tus objetivos con planes personalizados. Empieza a entrenar con planes hechos a la medida para alcanzar tus metas.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;