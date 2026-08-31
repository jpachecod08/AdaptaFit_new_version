import React, { useState } from 'react';
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
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  SportsGymnastics,
  Email,
  Lock,
  Badge,
  Phone,
  Description,
  FitnessCenter,
  MedicalServices,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('usuario');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    biografia: '',
    lesiones: '',
    experiencia: '',
    objetivos: '',
    nivel_fisico: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const endpoint =
      role === 'entrenador'
        ? '/api/users/register/trainer/'
        : '/api/users/register/user/';

    // Construir el payload según la estructura que espera el backend
    const payload =
      role === 'entrenador'
        ? {
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            trainer_profile: {
              especialidad: formData.objetivos || '',
              certificaciones: formData.experiencia || '',
              biografia: formData.biografia || '',
              telefono: formData.telefono || '',
            },
          }
        : {
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            profile: {
              objetivo: formData.objetivos || '',
              experiencia: formData.nivel_fisico || '',
              lesiones: formData.lesiones || '',
              training_type: 'calisthenics',
            },
          };

    await axios.post(`${API_URL}${endpoint}`, payload);

    setSnackbar({
      open: true,
      message: 'Cuenta creada correctamente',
      severity: 'success',
    });

    setTimeout(() => navigate('/login'), 1200);
  } catch (error) {
    console.error(error);
    setSnackbar({
      open: true,
      message: 'Error al crear la cuenta. Verifica los datos.',
      severity: 'error',
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f4f6f8',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 4, borderRadius: 2 }}>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" fontWeight={700}>
              Crear cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completa la información para configurar tu perfil correctamente
            </Typography>
          </Box>

          {/* Rol */}
          <ToggleButtonGroup
            fullWidth
            exclusive
            value={role}
            onChange={(e, v) => v && setRole(v)}
            sx={{ mb: 4 }}
          >
            <ToggleButton value="usuario">
              <Person sx={{ mr: 1 }} /> Usuario
            </ToggleButton>
            <ToggleButton value="entrenador">
              <SportsGymnastics sx={{ mr: 1 }} /> Entrenador
            </ToggleButton>
          </ToggleButtonGroup>

          <Box component="form" onSubmit={handleSubmit}>
            {/* ================== DATOS DE ACCESO ================== */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Datos de acceso
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Esta información será utilizada para iniciar sesión.
            </Typography>

            <TextField
              fullWidth
              label="Correo electrónico"
              name="email"
              margin="normal"
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />

            <Divider sx={{ my: 4 }} />

            {/* ================== INFORMACIÓN PERSONAL ================== */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Información personal
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Nos ayudará a identificarte y comunicarnos contigo.
            </Typography>

            <TextField
              fullWidth
              label="Nombre completo"
              name="nombre"
              margin="normal"
              value={formData.nombre}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Teléfono de contacto"
              name="telefono"
              margin="normal"
              value={formData.telefono}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 4 }} />

            {/* ================== PERFIL ================== */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Perfil y condición física
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Esta información permite adaptar la experiencia a tus necesidades.
            </Typography>

            <TextField
              fullWidth
              label="Objetivos de entrenamiento"
              name="objetivos"
              margin="normal"
              value={formData.objetivos}
              onChange={handleChange}
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FitnessCenter fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Nivel físico actual"
              name="nivel_fisico"
              margin="normal"
              value={formData.nivel_fisico}
              onChange={handleChange}
              helperText="Ejemplo: principiante, intermedio o avanzado"
            />

            <TextField
              fullWidth
              label="Lesiones o limitaciones"
              name="lesiones"
              margin="normal"
              value={formData.lesiones}
              onChange={handleChange}
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MedicalServices fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {role === 'entrenador' && (
              <TextField
                fullWidth
                label="Experiencia profesional como entrenador"
                name="experiencia"
                margin="normal"
                value={formData.experiencia}
                onChange={handleChange}
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              fullWidth
              label="Biografía"
              name="biografia"
              margin="normal"
              value={formData.biografia}
              onChange={handleChange}
              multiline
              rows={3}
              helperText="Esta información será visible en tu perfil"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 4,
                py: 1.3,
                fontWeight: 600,
                borderRadius: 1.5,
              }}
            >
              {loading ? <CircularProgress size={22} /> : 'Crear cuenta'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>¿Ya tienes cuenta?</Divider>

          <Button component={Link} to="/login" fullWidth variant="outlined">
            Iniciar sesión
          </Button>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegisterPage;
