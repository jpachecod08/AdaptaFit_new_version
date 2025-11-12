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
  InputAdornment,
  Fade,
  Divider,
  useTheme,
  useMediaQuery,
  Card,
} from '@mui/material';
import {
  Close,
  Person,
  SportsGymnastics,
  FitnessCenter,
  Email,
  Lock,
  PersonAdd,
  Cake,
  Straighten,
  MonitorWeight,
  CalendarMonth,
  Work,
  School,
  Description,
  Phone,
} from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
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
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
    setError(null);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiEndpointBase = `${API_URL}/api/users/register/`;
      const registerUrl = role === 'usuario'
        ? `${apiEndpointBase}user/`
        : `${apiEndpointBase}trainer/`;

      const fechaNacimiento = formData.fechaNacimiento.includes('/')
        ? formData.fechaNacimiento.split('/').reverse().map(p => p.padStart(2, '0')).join('-')
        : formData.fechaNacimiento;

      const payload = role === 'usuario'
        ? {
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            profile: {
              ...formData,
              fechaNacimiento,
            },
          }
        : {
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

      const response = await axios.post(registerUrl, payload);

      if (response.status === 201) {
        setSuccess(true);
        setSnackbarSeverity('success');
        setSnackbarMessage('¡Registro exitoso! Redirigiendo...');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error durante el registro:', err);
      const errorMessage = err.response?.data?.profile?.fechaNacimiento
        ? `Fecha de nacimiento: ${err.response.data.profile.fechaNacimiento[0]}`
        : 'Ocurrió un error al procesar el registro.';
      setSnackbarSeverity('error');
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Tamaños responsive
  const containerMaxWidth = isSmallMobile ? 'xs' : isMobile ? 'sm' : 'md';
  const headerPadding = isSmallMobile ? 2 : 3;
  const contentPadding = isSmallMobile ? 2 : 3;
  const titleVariant = isSmallMobile ? 'h6' : isMobile ? 'h5' : 'h4';
  const sectionVariant = isSmallMobile ? 'subtitle2' : 'h6';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Cambiado de center a flex-start
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: isSmallMobile ? 1 : 2,
        overflow: 'hidden', // Elimina el scroll del contenedor principal
      }}
    >
      <Container 
        maxWidth={containerMaxWidth} 
        sx={{ 
          py: isSmallMobile ? 1 : 2,
          height: '100vh', // Ocupa toda la altura
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Elimina scroll del container
        }}
      >
        <Fade in={true} timeout={600}>
          <Card 
            elevation={isSmallMobile ? 8 : 16}
            sx={{ 
              borderRadius: isSmallMobile ? 2 : 3,
              overflow: 'hidden',
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%', // Ocupa toda la altura disponible
              maxHeight: '100%', // Máximo 100% del contenedor
            }}
          >
            {/* Header - Fijo */}
            <Box 
              sx={{ 
                p: headerPadding, 
                background: 'linear-gradient(135deg, #00838F 0%, #004d40 100%)',
                textAlign: 'center',
                flexShrink: 0, // Evita que el header se encoja
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="center" mb={1} gap={2}>
                <FitnessCenter sx={{ fontSize: isSmallMobile ? 30 : 36, color: 'white' }} />
                <Typography 
                  variant={titleVariant}
                  fontWeight="800" 
                  color="white"
                  sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  AdaptaFit
                </Typography>
              </Box>
              <Typography 
                variant={isSmallMobile ? "body2" : "subtitle1"}
                color="rgba(255,255,255,0.9)"
              >
                Únete a nuestra comunidad fitness
              </Typography>
            </Box>

            {/* Contenido - Con scroll */}
            <Box 
              sx={{ 
                p: contentPadding,
                flex: 1, // Toma el espacio restante
                overflow: 'auto', // Solo scroll vertical aquí
                display: 'flex',
                flexDirection: 'column',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#a8a8a8',
                },
              }}
            >
              <Typography 
                variant={isSmallMobile ? "h6" : "h5"}
                textAlign="center" 
                fontWeight="600" 
                color="#00838F" 
                mb={3}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <PersonAdd sx={{ mr: 1, fontSize: isSmallMobile ? 20 : 24 }} />
                Crear Cuenta
              </Typography>

              {/* Selector de Rol */}
              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={handleRoleChange}
                fullWidth
                sx={{ 
                  mb: 3,
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: '600',
                    py: isSmallMobile ? 1 : 1.25,
                    fontSize: isSmallMobile ? '0.8rem' : '0.9rem',
                    border: '2px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1.5,
                    minHeight: isSmallMobile ? '44px' : '48px',
                    '&.Mui-selected': {
                      backgroundColor: '#00838F',
                      color: 'white',
                      borderColor: '#00838F',
                      boxShadow: '0 2px 8px rgba(0, 131, 143, 0.3)',
                      '&:hover': { backgroundColor: '#006064' }
                    },
                    '&:not(.Mui-selected)': {
                      '&:hover': {
                        backgroundColor: 'rgba(0, 131, 143, 0.05)',
                        borderColor: '#00838F',
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="usuario">
                  <Person sx={{ mr: 1, fontSize: isSmallMobile ? 18 : 20 }} />
                  {isSmallMobile ? 'Usuario' : 'Registrar como Usuario'}
                </ToggleButton>
                <ToggleButton value="entrenador">
                  <SportsGymnastics sx={{ mr: 1, fontSize: isSmallMobile ? 18 : 20 }} />
                  {isSmallMobile ? 'Entrenador' : 'Registrar como Entrenador'}
                </ToggleButton>
              </ToggleButtonGroup>

              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ flex: 1 }}>
                {/* Datos de Cuenta */}
                <Typography variant={sectionVariant} fontWeight="600" color="#00838F" mb={2}>
                  Datos de Cuenta
                </Typography>
                
                <TextField
                  label="Nombre Completo"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  size={isSmallMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 1.5 },
                  }}
                />
                
                <TextField
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  size={isSmallMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 1.5 },
                  }}
                />
                
                <TextField
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  size={isSmallMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowPassword} edge="end" size="small">
                          {showPassword ? <Close /> : <Lock />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 1.5 },
                  }}
                />

                {role === 'usuario' ? (
                  <Box mt={3}>
                    <Typography variant={sectionVariant} fontWeight="600" color="#00838F" mb={2}>
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
                      size={isSmallMobile ? "small" : "medium"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Cake sx={{ color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 },
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                    
                    <FormControl fullWidth margin="normal" size={isSmallMobile ? "small" : "medium"}>
                      <InputLabel>Género</InputLabel>
                      <Select name="genero" value={formData.genero} onChange={handleChange} label="Género">
                        <MenuItem value="masculino">Masculino</MenuItem>
                        <MenuItem value="femenino">Femenino</MenuItem>
                        <MenuItem value="otro">Otro</MenuItem>
                      </Select>
                    </FormControl>

                    <Box display="flex" gap={2} sx={{ flexDirection: isSmallMobile ? 'column' : 'row' }}>
                      <TextField
                        label="Altura (cm)"
                        name="altura"
                        type="number"
                        value={formData.altura}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        size={isSmallMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Straighten sx={{ color: 'grey.500' }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1.5 },
                        }}
                      />
                      <TextField
                        label="Peso (kg)"
                        name="peso"
                        type="number"
                        value={formData.peso}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        size={isSmallMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MonitorWeight sx={{ color: 'grey.500' }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1.5 },
                        }}
                      />
                    </Box>

                    <FormControl fullWidth margin="normal" size={isSmallMobile ? "small" : "medium"}>
                      <InputLabel>Objetivo Principal</InputLabel>
                      <Select name="objetivo" value={formData.objetivo} onChange={handleChange} label="Objetivo Principal">
                        <MenuItem value="perder_peso">Perder peso</MenuItem>
                        <MenuItem value="ganar_musculo">Ganar masa muscular</MenuItem>
                        <MenuItem value="mantenerse">Mantenerse en forma</MenuItem>
                        <MenuItem value="resistencia">Mejorar la resistencia</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" size={isSmallMobile ? "small" : "medium"}>
                      <InputLabel>Nivel de Experiencia</InputLabel>
                      <Select name="experiencia" value={formData.experiencia} onChange={handleChange} label="Nivel de Experiencia">
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
                      size={isSmallMobile ? "small" : "medium"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonth sx={{ color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 },
                      }}
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
                      size={isSmallMobile ? "small" : "medium"}
                      sx={{ borderRadius: 1.5 }}
                    />
                  </Box>
                ) : (
                  <Box mt={3}>
                    <Typography variant={sectionVariant} fontWeight="600" color="#00838F" mb={2}>
                      Datos Profesionales
                    </Typography>
                    
                    <TextField
                      label="Especialidad"
                      name="especialidad"
                      value={formData.especialidad}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      size={isSmallMobile ? "small" : "medium"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Work sx={{ color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 },
                      }}
                    />
                    
                    <TextField
                      label="Años de Experiencia"
                      name="anosExperiencia"
                      type="number"
                      value={formData.anosExperiencia}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      size={isSmallMobile ? "small" : "medium"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <School sx={{ color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 },
                      }}
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
                      size={isSmallMobile ? "small" : "medium"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Description sx={{ color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 },
                      }}
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
                      size={isSmallMobile ? "small" : "medium"}
                      sx={{ borderRadius: 1.5 }}
                    />
                    
                    <TextField
                      label="Número de Teléfono (opcional)"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      size={isSmallMobile ? "small" : "medium"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={{ color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 },
                      }}
                    />
                  </Box>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 1.5 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: isSmallMobile ? 1 : 1.5,
                    borderRadius: 1.5,
                    fontSize: isSmallMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #00838F 0%, #004d40 100%)',
                    boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)',
                    minHeight: isSmallMobile ? '44px' : '48px',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #006064 0%, #003d33 100%)',
                      boxShadow: '0 6px 20px rgba(0, 131, 143, 0.6)',
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                      background: 'grey.400',
                      boxShadow: 'none',
                      transform: 'none',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? (
                    <CircularProgress size={isSmallMobile ? 20 : 24} color="inherit" />
                  ) : (
                    <>
                      <PersonAdd sx={{ mr: 1, fontSize: isSmallMobile ? 18 : 20 }} />
                      {isSmallMobile ? 'Registrarse' : `Registrarse como ${role === 'usuario' ? 'Usuario' : 'Entrenador'}`}
                    </>
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    ¿Ya tienes cuenta?
                  </Typography>
                </Divider>

                <Box textAlign="center" sx={{ mb: 2 }}>
                  <Button
                    component={Link}
                    to="/"
                    variant="outlined"
                    fullWidth
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{
                      py: isSmallMobile ? 0.75 : 1,
                      borderRadius: 1.5,
                      fontSize: isSmallMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      textTransform: 'none',
                      borderColor: '#00838F',
                      color: '#00838F',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 131, 143, 0.08)',
                        borderColor: '#006064',
                      },
                    }}
                  >
                    Iniciar Sesión
                  </Button>
                </Box>
              </Box>
            </Box>
          </Card>
        </Fade>

        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          sx={{ bottom: isSmallMobile ? 60 : 80 }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{ 
              borderRadius: 1.5,
              fontSize: isSmallMobile ? '0.8rem' : '0.9rem',
              fontWeight: '500',
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default RegisterPage;