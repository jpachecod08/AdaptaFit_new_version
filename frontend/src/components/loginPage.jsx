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
  InputAdornment,
  IconButton,
  Fade,
  CircularProgress,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  SportsGymnastics,
  Login,
  Email,
  Lock,
  Key,
  Security,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }) => {
  const [role, setRole] = useState('usuario');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [redirectMessage, setRedirectMessage] = useState('');
  const [autoLogged, setAutoLogged] = useState(false);
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  
  // Estados para recuperación de contraseña
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(0);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      errors.email = 'El correo electrónico es requerido';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'El correo electrónico no es válido';
      isValid = false;
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  try {
    // CORREGIR: Cambiar "username" por "email"
    const payload = {
      email: email,  // ← CAMBIA ESTO
      password: password,
    };

    console.log('Enviando login con:', payload); // DEBUG

    const response = await axios.post(`${API_URL}/api/login/`, payload);
    
    console.log('Respuesta completa:', response); 
    console.log('Datos de respuesta:', response.data);

    const token = response.data.token;
    const userRoleFromBackend = response.data.tipo_usuario;

    if (!token) {
      throw new Error('No se recibió token de autenticación');
    }

    console.log('Token recibido:', token);
    console.log('Rol del backend:', userRoleFromBackend, 'Rol seleccionado:', role);

    // VALIDACIÓN MEJORADA - ADMINS PUEDEN ACCEDER A CUALQUIER ROL
    if (userRoleFromBackend === 'admin') {
      console.log('Usuario admin detectado, permitiendo acceso como:', role);
    } else if (userRoleFromBackend !== role) {
      throw new Error(`Tu cuenta es de ${userRoleFromBackend === 'usuario' ? 'Usuario' : 'Entrenador'}. Por favor, selecciona el tipo de cuenta correcto.`);
    }

    // Guardar datos en localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('actualUserRole', userRoleFromBackend);
    localStorage.setItem('userEmail', email);
    
    if(response.data.user_id) localStorage.setItem('userId', response.data.user_id);

    onLogin(token, role);

    setSnackbarMessage(`¡Inicio de sesión exitoso como ${role === 'usuario' ? 'Usuario' : 'Entrenador'}!`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);

    setTimeout(() => {
      if (role === 'usuario') {
        navigate('/dashboard');
      } else if (role === 'entrenador') {
        navigate('/entrenador/dashboard');
      } else {
        navigate('/login');
      }
    }, 1000);

  } catch (error) {
    console.error('Error completo de login:', error);
    console.error('Detalles del error:', error.response?.data); // DEBUG
    
    let errorMessage = 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales.';
    
    if (error.response?.status === 400) {
      if (error.response.data?.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error.response.data?.email) {
        errorMessage = error.response.data.email[0];
      } else {
        errorMessage = 'Credenciales inválidas - ' + JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setSnackbarMessage(errorMessage);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  // Funciones para recuperación de contraseña
  const handleForgotPassword = () => {
    setForgotPasswordOpen(true);
    setRecoveryStep(0);
    setRecoveryEmail('');
    setRecoveryCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setRecoveryStep(0);
  };

  const validateRecoveryEmail = () => {
    if (!recoveryEmail || !/\S+@\S+\.\S+/.test(recoveryEmail)) {
      setSnackbarMessage('Por favor ingresa un correo electrónico válido');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }
    return true;
  };

  const handleSendRecoveryCode = async () => {
    if (!validateRecoveryEmail()) return;

    setRecoveryLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/users/password-reset/`, {
        email: recoveryEmail,
      });

      setSnackbarMessage('Código de recuperación enviado a tu correo');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRecoveryStep(1);
    } catch (error) {
      console.error('Error enviando código:', error);
      const errorMessage = error.response?.data?.error || 'Error al enviar el código de recuperación';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!recoveryCode) {
      setSnackbarMessage('Por favor ingresa el código de verificación');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setRecoveryLoading(true);
    try {
      const response = await axios.post(`${API_URL}api/users/password-reset/verify/`, {
        email: recoveryEmail,
        code: recoveryCode,
      });

      setSnackbarMessage('Código verificado correctamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRecoveryStep(2);
    } catch (error) {
      console.error('Error verificando código:', error);
      const errorMessage = error.response?.data?.error || 'Código inválido o expirado';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setSnackbarMessage('Por favor completa todos los campos');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (newPassword.length < 6) {
      setSnackbarMessage('La contraseña debe tener al menos 6 caracteres');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setSnackbarMessage('Las contraseñas no coinciden');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setRecoveryLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/users/password-reset/confirm/`, {
        email: recoveryEmail,
        code: recoveryCode,
        new_password: newPassword,
      });

      setSnackbarMessage('Contraseña restablecida correctamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setForgotPasswordOpen(false);
      
      // Limpiar campos
      setRecoveryEmail('');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryStep(0);
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      const errorMessage = error.response?.data?.error || 'Error al restablecer la contraseña';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Tamaños responsive
  const containerMaxWidth = isMobile ? 'xs' : isTablet ? 'sm' : 'sm';
  const logoSize = isMobile ? 60 : 70;
  const headerPadding = isMobile ? 2 : 3;
  const contentPadding = isMobile ? 3 : 4;
  const titleVariant = isMobile ? 'h5' : 'h4';
  const subtitleVariant = isMobile ? 'body2' : 'subtitle1';
  const buttonPadding = isMobile ? 1 : 1.5;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: isMobile ? 1 : 2,
        position: 'relative',
        overflow: 'auto',
      }}
    >
      <Container 
        maxWidth={containerMaxWidth} 
        sx={{ 
          maxHeight: '100vh',
          overflow: 'auto',
          py: isMobile ? 1 : 2
        }}
      >
        <Fade in={true} timeout={600}>
          <Paper 
            elevation={isMobile ? 8 : 16}
            sx={{ 
              borderRadius: isMobile ? 2 : 3,
              overflow: 'hidden',
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              maxWidth: '100%',
              mx: 'auto',
            }}
          >
            {/* Header Compacto */}
            <Box 
              sx={{ 
                p: headerPadding, 
                background: 'linear-gradient(135deg, #00838F 0%, #004d40 100%)',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                mb={isMobile ? 1 : 2}
                flexDirection={isMobile ? 'column' : 'row'}
                gap={isMobile ? 1 : 2}
              >
                <img 
                  src="/AdaptaFitLogo.png" 
                  alt="AdaptaFit Logo" 
                  style={{ 
                    width: logoSize, 
                    height: logoSize,
                    borderRadius: '50%',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }} 
                />
                <Box textAlign={isMobile ? 'center' : 'left'}>
                  <Typography 
                    variant={titleVariant}
                    fontWeight="800" 
                    color="white"
                    sx={{ 
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      lineHeight: 1.2
                    }}
                  >
                    AdaptaFit
                  </Typography>
                  <Typography 
                    variant={subtitleVariant}
                    color="rgba(255,255,255,0.9)"
                    sx={{ mt: 0.5 }}
                  >
                    Fitness Personalizado
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Formulario Compacto */}
            <Box sx={{ p: contentPadding }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"}
                textAlign="center" 
                fontWeight="600" 
                color="#00838F" 
                mb={isMobile ? 2 : 3}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Login sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
                Iniciar Sesión
              </Typography>

              {/* Selector de Rol Compacto (SE MANTIENE VISUALMENTE) */}
              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={handleRoleChange}
                fullWidth
                sx={{ 
                  mb: isMobile ? 3 : 4,
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: '600',
                    py: isMobile ? 1 : 1.25,
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    border: '2px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1.5,
                    minHeight: isMobile ? '44px' : '48px',
                    '&.Mui-selected': {
                      backgroundColor: '#00838F',
                      color: 'white',
                      borderColor: '#00838F',
                      boxShadow: '0 2px 8px rgba(0, 131, 143, 0.3)',
                      '&:hover': {
                        backgroundColor: '#006064',
                      }
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
                  <Person sx={{ mr: 1, fontSize: isMobile ? 18 : 20 }} />
                  Usuario
                </ToggleButton>
                <ToggleButton value="entrenador">
                  <SportsGymnastics sx={{ mr: 1, fontSize: isMobile ? 18 : 20 }} />
                  Entrenador
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Formulario Compacto */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                {/* Campo Email Compacto */}
                <TextField
                  label="Correo Electrónico"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'grey.500', fontSize: isMobile ? 20 : 24 }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 1.5,
                      backgroundColor: alpha('#00838F', 0.02),
                      '&:hover': {
                        backgroundColor: alpha('#00838F', 0.04),
                      },
                    },
                  }}
                  sx={{ mb: 2 }}
                />

                {/* Campo Contraseña Compacto */}
                <TextField
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'grey.500', fontSize: isMobile ? 20 : 24 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                          size={isMobile ? "small" : "medium"}
                          sx={{ color: 'grey.600' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 1.5,
                      backgroundColor: alpha('#00838F', 0.02),
                      '&:hover': {
                        backgroundColor: alpha('#00838F', 0.04),
                      },
                    },
                  }}
                  sx={{ mb: 2 }}
                />

                {/* Link de recuperación de contraseña */}
                <Box sx={{ textAlign: 'right', mb: 3 }}>
                  <Button
                    onClick={handleForgotPassword}
                    sx={{
                      textTransform: 'none',
                      color: '#00838F',
                      fontWeight: '500',
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      p: 0,
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#006064',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Box>

                {/* Botón de Login Compacto */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: buttonPadding,
                    borderRadius: 1.5,
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #00838F 0%, #004d40 100%)',
                    boxShadow: '0 2px 8px rgba(0, 131, 143, 0.4)',
                    minHeight: isMobile ? '44px' : '48px',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #006064 0%, #003d33 100%)',
                      boxShadow: '0 4px 12px rgba(0, 131, 143, 0.6)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
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
                    <CircularProgress size={isMobile ? 20 : 24} color="inherit" />
                  ) : (
                    <>
                      <Login sx={{ mr: 1, fontSize: isMobile ? 18 : 20 }} />
                      {isMobile ? 'Ingresar' : `Ingresar como ${role === 'usuario' ? 'Usuario' : 'Entrenador'}`}
                    </>
                  )}
                </Button>
              </Box>

              {/* Separador Compacto */}
              <Divider sx={{ my: isMobile ? 2.5 : 3 }}>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ px: 1 }}>
                  ¿No tienes cuenta?
                </Typography>
              </Divider>

              {/* Link de Registro Compacto */}
              <Box textAlign="center">
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    py: buttonPadding,
                    borderRadius: 1.5,
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    textTransform: 'none',
                    borderColor: '#00838F',
                    color: '#00838F',
                    borderWidth: 2,
                    minHeight: isMobile ? '40px' : '44px',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 131, 143, 0.08)',
                      borderColor: '#006064',
                      borderWidth: 2,
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Crear Cuenta
                </Button>
              </Box>

              {/* Texto de términos compacto */}
              <Typography 
                variant="caption" 
                display="block" 
                textAlign="center" 
                color="text.secondary" 
                mt={2}
                sx={{ opacity: 0.6, fontSize: isMobile ? '0.7rem' : '0.75rem' }}
              >
                Al continuar aceptas nuestros Términos y Privacidad
              </Typography>
            </Box>
          </Paper>
        </Fade>

        {/* Dialog para recuperación de contraseña */}
        <Dialog 
          open={forgotPasswordOpen} 
          onClose={handleCloseForgotPassword}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            background: 'linear-gradient(135deg, #00838F 0%, #004d40 100%)',
            color: 'white',
            py: 2
          }}>
            <Box display="flex" alignItems="center" justifyContent="center">
              <Security sx={{ mr: 1 }} />
              Recuperar Contraseña
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 3 }}>
            <Stepper activeStep={recoveryStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Email</StepLabel>
              </Step>
              <Step>
                <StepLabel>Código</StepLabel>
              </Step>
              <Step>
                <StepLabel>Nueva Contraseña</StepLabel>
              </Step>
            </Stepper>

            {recoveryStep === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ingresa tu correo electrónico para recibir un código de verificación
                </Typography>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            {recoveryStep === 1 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ingresa el código de verificación que enviamos a tu correo
                </Typography>
                <TextField
                  fullWidth
                  label="Código de Verificación"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Key sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            {recoveryStep === 2 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ingresa tu nueva contraseña
                </Typography>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size={isMobile ? "small" : "medium"}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Button 
              onClick={handleCloseForgotPassword}
              variant="outlined"
              fullWidth={isMobile}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (recoveryStep === 0) handleSendRecoveryCode();
                else if (recoveryStep === 1) handleVerifyCode();
                else if (recoveryStep === 2) handleResetPassword();
              }}
              variant="contained"
              disabled={recoveryLoading}
              fullWidth={isMobile}
              sx={{
                background: 'linear-gradient(135deg, #00838F 0%, #004d40 100%)',
              }}
            >
              {recoveryLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : recoveryStep === 0 ? (
                'Enviar Código'
              ) : recoveryStep === 1 ? (
                'Verificar Código'
              ) : (
                'Restablecer Contraseña'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar responsive */}
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          sx={{
            bottom: isMobile ? 70 : 80,
          }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{ 
              borderRadius: 1.5,
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {snackbarMessage || redirectMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default LoginPage;