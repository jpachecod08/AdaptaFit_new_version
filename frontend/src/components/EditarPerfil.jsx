import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import { 
  ArrowLeft, 
  Save, 
  User,
  Calendar,
  Ruler,
  Weight,
  Target,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const EditarPerfil = ({ token, onUpdate }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    fechaNacimiento: '',
    genero: '',
    altura: '',
    peso: '',
    objetivo: '',
    experiencia: '',
    frecuencia: '',
    lesiones: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await axios.get(`${API_URL}/api/users/profile/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        
        const userData = response.data;
        console.log('Datos recibidos del backend:', userData);
        
        // Los datos del perfil están en userData.profile
        const profileData = userData.profile || {};
        
        // Formatear fecha si existe
        let fechaFormateada = '';
        if (profileData.fechaNacimiento) {
          const fecha = new Date(profileData.fechaNacimiento);
          fechaFormateada = fecha.toISOString().split('T')[0];
        }

        // Mapear correctamente los datos desde profile
        setFormData({
          nombre: userData.nombre || '',
          email: userData.email || '',
          fechaNacimiento: fechaFormateada,
          genero: profileData.genero || '',
          altura: profileData.altura || '',
          peso: profileData.peso || '',
          objetivo: profileData.objetivo || '',
          experiencia: profileData.experiencia || '',
          frecuencia: profileData.frecuencia || '',
          lesiones: profileData.lesiones || '',
        });

      } catch (err) {
        console.error('Error al cargar perfil:', err);
        setError('No se pudieron cargar los datos del perfil.');
        showSnackbar('error', 'Error al cargar el perfil');
      } finally {
        setLoadingProfile(false);
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const showSnackbar = (severity, message) => {
    setSnackbarSeverity(severity);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
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

  try {
    // Preparar datos para enviar
    const payload = {
      nombre: formData.nombre,
      email: formData.email,
      profile: {
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        altura: formData.altura ? parseInt(formData.altura) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        objetivo: formData.objetivo,
        experiencia: formData.experiencia,
        frecuencia: formData.frecuencia ? parseInt(formData.frecuencia) : null,
        lesiones: formData.lesiones,
      }
    };

    console.log('Enviando datos al backend:', payload);

    // ✅ CORREGIDO: Usar la URL correcta que SÍ existe
    const response = await axios.put(
      `${API_URL}/api/users/profile/`,  // ← CAMBIA ESTA LÍNEA
      payload,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    if (response.status === 200) {
      showSnackbar('success', 'Perfil actualizado exitosamente');
      setSuccess(true);
      
      if (onUpdate) {
        onUpdate(response.data);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    console.error('Detalles del error:', err.response?.data);
    
    let errorMessage = 'Error al actualizar el perfil.';
    
    if (err.response?.data) {
      const errorData = err.response.data;
      if (typeof errorData === 'object') {
        const errors = [];
        if (errorData.profile) {
          Object.values(errorData.profile).forEach(error => {
            if (Array.isArray(error)) {
              errors.push(...error);
            } else {
              errors.push(error);
            }
          });
        } else {
          Object.values(errorData).forEach(error => {
            if (Array.isArray(error)) {
              errors.push(...error);
            } else {
              errors.push(error);
            }
          });
        }
        errorMessage = errors[0] || errorMessage;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    }
    
    showSnackbar('error', errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleCancel = () => {
    navigate('/dashboard');
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

  if (loadingProfile) {
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
            Cargando tu perfil...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md" sx={{ height: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowLeft size={20} />}
            onClick={handleCancel}
            sx={{ 
              mb: 2,
              color: '#667eea',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            Volver al Dashboard
          </Button>
          
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <User size={32} color="#667eea" style={{ marginRight: 12 }} />
                <Typography variant="h4" fontWeight="700" color="#667eea">
                  Editar Perfil
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Actualiza tu información personal y preferencias de entrenamiento.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Formulario - Ahora con altura completa */}
        <Paper 
          elevation={2} 
          sx={{ 
            borderRadius: 3, 
            overflow: 'hidden',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ flex: 1 }}>
            <CardContent sx={{ p: 4, height: '100%' }}>
              {/* Información Básica */}
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <User size={20} style={{ marginRight: 8 }} />
                Información Básica
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombre Completo"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    autoComplete="name"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Correo Electrónico"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    autoComplete="email"
                    required
                  />
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Nacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
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
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Información Física */}
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Ruler size={20} style={{ marginRight: 8 }} />
                Información Física
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Altura (cm)"
                    name="altura"
                    type="number"
                    value={formData.altura}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ endAdornment: 'cm' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Peso (kg)"
                    name="peso"
                    type="number"
                    value={formData.peso}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ endAdornment: 'kg' }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Preferencias de Entrenamiento */}
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Target size={20} style={{ marginRight: 8 }} />
                Preferencias de Entrenamiento
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Objetivo Principal</InputLabel>
                    <Select 
                      name="objetivo" 
                      value={formData.objetivo} 
                      onChange={handleChange}
                      label="Objetivo Principal"
                    >
                      <MenuItem value="perder_peso">Perder peso</MenuItem>
                      <MenuItem value="ganar_musculo">Ganar masa muscular</MenuItem>
                      <MenuItem value="mantenerse">Mantenerse en forma</MenuItem>
                      <MenuItem value="resistencia">Mejorar la resistencia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Nivel de Experiencia</InputLabel>
                    <Select 
                      name="experiencia" 
                      value={formData.experiencia} 
                      onChange={handleChange}
                      label="Nivel de Experiencia"
                    >
                      <MenuItem value="principiante">Principiante</MenuItem>
                      <MenuItem value="intermedio">Intermedio</MenuItem>
                      <MenuItem value="avanzado">Avanzado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Frecuencia de Entrenamiento (días/semana)"
                    name="frecuencia"
                    type="number"
                    value={formData.frecuencia}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 1, max: 7 } }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Información Adicional */}
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <AlertTriangle size={20} style={{ marginRight: 8 }} />
                Información Adicional
              </Typography>
              
              <TextField
                label="Lesiones o limitaciones (opcional)"
                name="lesiones"
                value={formData.lesiones}
                onChange={handleChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                placeholder="Describe cualquier lesión, condición médica o limitación que debamos considerar en tu plan de entrenamiento..."
              />

              {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Botones de Acción */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, pt: 2 }}>
                <Button
                  onClick={handleCancel}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1,
                    textTransform: 'none'
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <Save size={20} />}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    }
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </CardContent>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        action={snackbarAction}
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
  );
};

export default EditarPerfil;