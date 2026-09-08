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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
    training_type: 'gym',
    frecuencia: 3,
    peso: '',
    altura: '',
    fechaNacimiento: '',
    genero: '',
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
              fechaNacimiento: formData.fechaNacimiento || null,
              genero: formData.genero || '',
              altura: formData.altura ? parseInt(formData.altura) : null,
              peso: formData.peso ? parseFloat(formData.peso) : null,
              objetivo: formData.objetivos || 'mantenerse',
              experiencia: formData.nivel_fisico || 'principiante',
              frecuencia: formData.frecuencia ? parseInt(formData.frecuencia) : 3,
              lesiones: formData.lesiones || '',
              training_type: formData.training_type,
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


  const trainingTypeOptions = [
    { value: 'gym', label: '🏋️ Gimnasio (pesas/máquinas)' },
    { value: 'calisthenics', label: '💪 Calistenia (peso corporal)' },
    { value: 'cardio', label: '❤️ Aeróbico (correr, nadar, bici)' },
    { value: 'yoga', label: '🧘 Yoga / Pilates' },
    { value: 'mixed', label: '🔄 Mixto (combinado)' },
  ];

  const objetivoOptions = [
    { value: 'perder_peso', label: 'Perder peso' },
    { value: 'ganar_musculo', label: 'Ganar masa muscular' },
    { value: 'mantenerse', label: 'Mantenerse en forma' },
    { value: 'resistencia', label: 'Mejorar la resistencia' },
  ];

  const experienciaOptions = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
  ];

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
              Esta información permite crear un plan de entrenamiento 100% adaptado a ti.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>🏋️ Tipo de entrenamiento</InputLabel>
                  <Select
                    name="training_type"
                    value={formData.training_type}
                    onChange={handleChange}
                    label="Tipo de entrenamiento"
                  >
                    {trainingTypeOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Objetivo principal</InputLabel>
                  <Select
                    name="objetivos"
                    value={formData.objetivos}
                    onChange={handleChange}
                    label="Objetivo principal"
                  >
                    {objetivoOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Nivel físico actual</InputLabel>
                  <Select
                    name="nivel_fisico"
                    value={formData.nivel_fisico}
                    onChange={handleChange}
                    label="Nivel físico actual"
                  >
                    {experienciaOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Frecuencia de entrenamiento (días/semana)"
                  name="frecuencia"
                  type="number"
                  margin="normal"
                  value={formData.frecuencia}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 1, max: 7 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estatura (cm)"
                  name="altura"
                  type="number"
                  margin="normal"
                  value={formData.altura}
                  onChange={handleChange}
                  InputProps={{ endAdornment: 'cm' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Peso (kg)"
                  name="peso"
                  type="number"
                  margin="normal"
                  value={formData.peso}
                  onChange={handleChange}
                  InputProps={{ endAdornment: 'kg' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de nacimiento"
                  name="fechaNacimiento"
                  type="date"
                  margin="normal"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Género</InputLabel>
                  <Select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    label="Género"
                  >
                    <MenuItem value="masculino">Masculino</MenuItem>
                    <MenuItem value="femenino">Femenino</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
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
              </Grid>
            </Grid>

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
