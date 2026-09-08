import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating
} from '@mui/material';
import {
  User,
  Video,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Star,
  Award,
  Users,
  Clock,
  X,
  Edit,
  LogOut
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const MiEntrenador = ({ token }) => {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [callDialog, setCallDialog] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchMyTrainer();
  }, []);

  const getAuthHeader = () => {
    return token ? `Token ${token}` : null;
  };

  const fetchMyTrainer = async () => {
    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      
      if (!authHeader) {
        setError('No estás autenticado');
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/trainers/my-trainer/`, {
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Mi entrenador:', response.data);
      if (response.data.trainer) {
        setTrainer(response.data.trainer);
      }
      setError('');
    } catch (err) {
      console.error('❌ Error fetching my trainer:', err);
      // No es error si no tiene entrenador
      if (err.response?.status !== 404) {
        setError('Error al cargar información del entrenador');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeTrainer = async () => {
    try {
      setRemoving(true);
      const authHeader = getAuthHeader();
      
      const response = await axios.post(
        `${API_URL}/api/users/trainers/remove/`,
        {},
        { 
          headers: { 
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(response.data.message || 'Entrenador removido exitosamente');
      setTrainer(null);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('❌ Error removing trainer:', err);
      setError('Error al remover entrenador: ' + (err.response?.data?.error || err.message));
    } finally {
      setRemoving(false);
    }
  };

  const scheduleSession = (type) => {
    alert(`📅 Próximamente: Podrás agendar una sesión de ${type} con ${trainer?.nombre}`);
    setScheduleDialog(false);
  };

  const startVideoCall = () => {
    alert(`🎥 Próximamente: Iniciando videollamada con ${trainer?.nombre}`);
    setCallDialog(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'No disponible';
    }
  };

  const getAvailableSlots = () => {
    // Horarios de ejemplo
    return [
      { day: 'Lunes', time: '9:00 AM - 10:00 AM', available: true },
      { day: 'Martes', time: '2:00 PM - 3:00 PM', available: true },
      { day: 'Miércoles', time: '11:00 AM - 12:00 PM', available: false },
      { day: 'Jueves', time: '4:00 PM - 5:00 PM', available: true },
      { day: 'Viernes', time: '10:00 AM - 11:00 AM', available: true },
    ];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando información del entrenador...
        </Typography>
      </Box>
    );
  }

  if (!trainer) {
    return (
      <Container maxWidth="md">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: 3
          }}
        >
          <Box sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%',
            background: 'rgba(0, 131, 143, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#00838F'
          }}>
            <User size={40} />
          </Box>
          
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Aún no tienes un entrenador asignado
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            Conecta con un entrenador certificado para obtener rutinas personalizadas, seguimiento constante y sesiones de videollamada.
          </Typography>
          
          <Button 
            variant="contained" 
            size="large"
            href="/seleccionar-entrenador"
            sx={{ 
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600
            }}
          >
            Buscar Entrenadores Disponibles
          </Button>
          
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Beneficios de tener un entrenador:
            </Typography>
            <Grid container spacing={1} justifyContent="center">
              <Grid item>
                <Chip label="Rutinas personalizadas" size="small" />
              </Grid>
              <Grid item>
                <Chip label="Ajustes en tiempo real" size="small" />
              </Grid>
              <Grid item>
                <Chip label="Videollamadas" size="small" />
              </Grid>
              <Grid item>
                <Chip label="Seguimiento constante" size="small" />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  fontSize: '1.75rem',
                  mr: 3
                }}
              >
                {trainer.nombre?.charAt(0) || trainer.email.charAt(0).toUpperCase()}
              </Avatar>
              
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {trainer.nombre || trainer.email.split('@')[0]}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <Chip 
                    label={trainer.specialization || 'Entrenador certificado'} 
                    color="primary" 
                    size="small" 
                  />
                  {trainer.experience_years && (
                    <Chip 
                      icon={<Award size={14} />}
                      label={`${trainer.experience_years} años de experiencia`} 
                      variant="outlined"
                      size="small" 
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star size={16} style={{ color: '#FFD700', marginRight: 4 }} />
                    <Typography variant="body2">4.8</Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Tu entrenador personal desde {formatDate(trainer.date_joined)}
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="outlined"
              color="error"
              onClick={removeTrainer}
              disabled={removing}
              startIcon={removing ? <CircularProgress size={16} /> : <LogOut size={16} />}
            >
              {removing ? 'Removiendo...' : 'Cambiar Entrenador'}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* Columna izquierda - Información y contacto */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Sobre tu entrenador
            </Typography>
            <Typography variant="body1" paragraph>
              {trainer.bio || 'Entrenador certificado especializado en fitness y bienestar. Comprometido con ayudar a sus clientes a alcanzar sus objetivos de forma segura y efectiva.'}
            </Typography>
            
            {trainer.certifications && (
              <>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                  Certificaciones
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {trainer.certifications.split(',').map((cert, idx) => (
                    <Chip
                      key={idx}
                      label={cert.trim()}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Contacto y comunicación
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Mail size={20} color="#00838F" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={trainer.email}
                    />
                  </ListItem>
                  
                  {trainer.phone && (
                    <ListItem>
                      <ListItemIcon>
                        <Phone size={20} color="#00838F" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Teléfono" 
                        secondary={trainer.phone}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  p: 3,
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Soporte disponible
                  </Typography>
                  <List dense sx={{ color: 'white' }}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle size={16} />
                      </ListItemIcon>
                      <ListItemText primary="Respuesta en 24h" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle size={16} />
                      </ListItemIcon>
                      <ListItemText primary="Sesiones programadas" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle size={16} />
                      </ListItemIcon>
                      <ListItemText primary="Ajustes de rutina" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Columna derecha - Acciones rápidas */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              Acciones rápidas
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Video size={20} />}
                onClick={() => setCallDialog(true)}
                sx={{ 
                  py: 1.5,
                  justifyContent: 'flex-start',
                  fontWeight: 600
                }}
              >
                Iniciar Videollamada
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<MessageSquare size={20} />}
                onClick={() => alert('Próximamente: Chat integrado')}
                sx={{ 
                  py: 1.5,
                  justifyContent: 'flex-start',
                  fontWeight: 600
                }}
              >
                Enviar Mensaje
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Calendar size={20} />}
                onClick={() => setScheduleDialog(true)}
                sx={{ 
                  py: 1.5,
                  justifyContent: 'flex-start',
                  fontWeight: 600
                }}
              >
                Agendar Sesión
              </Button>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Estadísticas
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Clientes activos
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {trainer.clients_count || 0}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Experiencia
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {trainer.experience_years || 'N/A'} años
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Calificación
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={4.8} precision={0.1} readOnly size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>4.8</Typography>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              "Mi objetivo es ayudarte a alcanzar tus metas de forma segura y sostenible."
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Diálogo para agendar sesión */}
      <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Agendar sesión con {trainer.nombre?.split(' ')[0]}</Typography>
            <IconButton onClick={() => setScheduleDialog(false)} size="small">
              <X />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            Selecciona el tipo de sesión que deseas agendar:
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
                onClick={() => scheduleSession('consulta inicial')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Users size={32} color="#667eea" style={{ marginBottom: 16 }} />
                  <Typography variant="h6" gutterBottom>
                    Consulta Inicial
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    60 minutos • Evaluación completa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
                onClick={() => scheduleSession('seguimiento')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircle size={32} color="#4CAF50" style={{ marginBottom: 16 }} />
                  <Typography variant="h6" gutterBottom>
                    Sesión de Seguimiento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    30 minutos • Ajustes de rutina
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 4 }}>
            Horarios disponibles esta semana:
          </Typography>
          
          <List>
            {getAvailableSlots().map((slot, index) => (
              <ListItem 
                key={index}
                secondaryAction={
                  slot.available ? (
                    <Button size="small" variant="outlined">
                      Seleccionar
                    </Button>
                  ) : (
                    <Chip label="No disponible" size="small" />
                  )
                }
              >
                <ListItemIcon>
                  <Calendar size={20} />
                </ListItemIcon>
                <ListItemText 
                  primary={`${slot.day} - ${slot.time}`}
                  secondary={slot.available ? "Disponible" : "Ocupado"}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setScheduleDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => scheduleSession('personalizada')}>
            Solicitar horario personalizado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para videollamada */}
      <Dialog open={callDialog} onClose={() => setCallDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Iniciar videollamada</Typography>
            <IconButton onClick={() => setCallDialog(false)} size="small">
              <X />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Video size={64} color="#667eea" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Conéctate con {trainer.nombre?.split(' ')[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              La videollamada se realizará a través de nuestra plataforma segura.
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Recomendaciones:</strong><br/>
              • Ten buena conexión a internet<br/>
              • Usa auriculares para mejor calidad<br/>
              • Prepara tu espacio de entrenamiento<br/>
              • Ten a mano tu rutina actual
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCallDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={startVideoCall} startIcon={<Video size={16} />}>
            Iniciar Videollamada
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MiEntrenador;