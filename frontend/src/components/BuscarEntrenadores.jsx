import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Box,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  Search,
  User,     
  Dumbbell,
  Star,
  CheckCircle,
  Phone,
  Mail,
  Award,
  BadgeCheck,
  Video,
  MessageSquare,
  X,
  Calendar
} from 'lucide-react';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import axios from 'axios';
import { API_URL } from '../config';

const BuscarEntrenadores = ({ token, onSelectTrainer }) => {
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = trainers.filter(trainer =>
        trainer.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.certifications?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTrainers(filtered);
    } else {
      setFilteredTrainers(trainers);
    }
  }, [searchTerm, trainers]);

  const getAuthHeader = () => {
    return token ? `Token ${token}` : null;
  };

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      
      if (!authHeader) {
        setError('No estás autenticado');
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/trainers/available/`, {
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Entrenadores recibidos:', response.data);
      setTrainers(response.data);
      setFilteredTrainers(response.data);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching trainers:', err);
      setError('Error al cargar entrenadores: ' + (err.response?.data?.error || err.message));
      
      // Datos de ejemplo para pruebas
      if (err.response?.status === 404) {
        console.log('⚠️ Usando datos de ejemplo para desarrollo');
        setTrainers([
          {
            id: 1,
            nombre: 'Carlos Rodríguez',
            email: 'carlos@ejemplo.com',
            specialization: 'Fitness y Nutrición',
            experience_years: 8,
            certifications: 'ISSA Certified, Nutrición Deportiva',
            bio: 'Especialista en transformaciones corporales y nutrición deportiva',
            phone: '+57 300 123 4567',
            clients_count: 25,
            date_joined: '2024-01-15'
          },
          {
            id: 2,
            nombre: 'Ana Martínez',
            email: 'ana@ejemplo.com',
            specialization: 'Entrenamiento Funcional',
            experience_years: 5,
            certifications: 'ACE Certified, CrossFit Level 1',
            bio: 'Especialista en entrenamiento funcional y rehabilitación',
            phone: '+57 310 987 6543',
            clients_count: 18,
            date_joined: '2024-03-20'
          }
        ]);
        setFilteredTrainers([
          {
            id: 1,
            nombre: 'Carlos Rodríguez',
            email: 'carlos@ejemplo.com',
            specialization: 'Fitness y Nutrición',
            experience_years: 8,
            certifications: 'ISSA Certified, Nutrición Deportiva',
            bio: 'Especialista en transformaciones corporales y nutrición deportiva',
            phone: '+57 300 123 4567',
            clients_count: 25,
            date_joined: '2024-01-15'
          },
          {
            id: 2,
            nombre: 'Ana Martínez',
            email: 'ana@ejemplo.com',
            specialization: 'Entrenamiento Funcional',
            experience_years: 5,
            certifications: 'ACE Certified, CrossFit Level 1',
            bio: 'Especialista en entrenamiento funcional y rehabilitación',
            phone: '+57 310 987 6543',
            clients_count: 18,
            date_joined: '2024-03-20'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const viewTrainerDetails = (trainer) => {
    setSelectedTrainer(trainer);
    setDialogOpen(true);
  };

  const assignTrainer = async (trainerId) => {
    try {
      setAssigning(true);
      const authHeader = getAuthHeader();
      
      if (!authHeader) {
        setError('No estás autenticado');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/users/trainers/assign/`,
        { trainer_id: trainerId },
        { 
          headers: { 
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Entrenador asignado:', response.data);
      setSuccess(response.data.message || 'Entrenador asignado exitosamente');
      
      if (onSelectTrainer) {
        onSelectTrainer(response.data.data);
      }
      
      // Cerrar diálogo después de 3 segundos
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('❌ Error assigning trainer:', err);
      setError('Error al asignar entrenador: ' + (err.response?.data?.error || err.message));
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `Se unió hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Se unió hace ${months} mes${months !== 1 ? 'es' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `Se unió hace ${years} año${years !== 1 ? 's' : ''}`;
      }
    } catch (e) {
      return 'Fecha no disponible';
    }
  };

  const calculateRating = (trainer) => {
    // Lógica simple para rating basado en experiencia y clientes
    let rating = 4.0;
    if (trainer.experience_years > 5) rating += 0.5;
    if (trainer.experience_years > 10) rating += 0.5;
    if (trainer.clients_count > 20) rating += 0.3;
    if (trainer.clients_count > 50) rating += 0.2;
    return Math.min(rating, 5.0).toFixed(1);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando entrenadores...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' } }}>
          Encuentra Tu Entrenador Ideal
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Entrenadores certificados listos para guiarte en tu transformación
        </Typography>
      </Box>

      {/* Barra de búsqueda */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Buscar entrenador por nombre, especialidad o certificación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.9)',
            }
          }}
        />
      </Box>

      {/* Mensajes de estado */}
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

      {/* Contador de resultados */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {filteredTrainers.length} entrenador{filteredTrainers.length !== 1 ? 'es' : ''} encontrado{filteredTrainers.length !== 1 ? 's' : ''}
        {searchTerm && ` para "${searchTerm}"`}
      </Typography>

      {/* Lista de entrenadores */}
      {filteredTrainers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <User sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron entrenadores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm 
              ? 'Prueba con otros términos de búsqueda'
              : 'No hay entrenadores disponibles en este momento'
            }
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredTrainers.map((trainer) => (
            <Grid item xs={12} md={6} key={trainer.id}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        mr: 2
                      }}
                    >
                      {trainer.nombre?.charAt(0) || trainer.email.charAt(0).toUpperCase()}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {trainer.nombre || trainer.email.split('@')[0]}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {trainer.specialization || 'Entrenador certificado'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Star size={16} style={{ color: '#FFD700', marginRight: 4 }} />
                            <Typography variant="body2" fontWeight="bold">
                              {calculateRating(trainer)}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            ({trainer.clients_count || 0} clientes)
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 1 }}>
                        {trainer.experience_years && (
                          <Chip
                            icon={<FitnessCenterIcon size={14} />}
                            label={`${trainer.experience_years} años de experiencia`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        )}
                        {trainer.certifications && trainer.certifications.split(',').slice(0, 1).map((cert, idx) => (
                          <Chip
                            key={idx}
                            icon={<BadgeCheck size={14} />}
                            label={cert.trim()}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="body2" paragraph sx={{ minHeight: 60 }}>
                    {trainer.bio || 'Entrenador especializado en fitness y bienestar.'}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Mail size={14} style={{ marginRight: 8, opacity: 0.7 }} />
                      <Typography variant="body2">
                        {trainer.email}
                      </Typography>
                    </Box>
                    
                    {trainer.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone size={14} style={{ marginRight: 8, opacity: 0.7 }} />
                        <Typography variant="body2">
                          {trainer.phone}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    {formatDate(trainer.date_joined)}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => viewTrainerDetails(trainer)}
                    startIcon={<User size={16} />}
                  >
                    Ver Detalles
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo de detalles del entrenador */}
      {selectedTrainer && (
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: 'primary.main',
                    fontSize: '1.25rem',
                    mr: 2
                  }}
                >
                  {selectedTrainer.nombre?.charAt(0) || selectedTrainer.email.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedTrainer.nombre || selectedTrainer.email.split('@')[0]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTrainer.specialization || 'Entrenador certificado'}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDialogOpen(false)} size="small">
                <X />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Sobre {selectedTrainer.nombre?.split(' ')[0] || 'este entrenador'}
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedTrainer.bio || 'Entrenador especializado en fitness y bienestar.'}
                </Typography>

                {selectedTrainer.certifications && (
                  <>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                      Certificaciones
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedTrainer.certifications.split(',').map((cert, idx) => (
                        <Chip
                          key={idx}
                          label={cert.trim()}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<BadgeCheck size={14} />}
                        />
                      ))}
                    </Box>
                  </>
                )}

                <Grid container spacing={2} sx={{ mt: 3 }}>
                  {selectedTrainer.experience_years && (
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, background: 'rgba(0, 131, 143, 0.05)', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Experiencia
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {selectedTrainer.experience_years} años
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, background: 'rgba(0, 131, 143, 0.05)', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Clientes actuales
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedTrainer.clients_count || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Información de contacto
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Mail size={16} style={{ marginRight: 8, opacity: 0.7 }} />
                    <Typography variant="body2">
                      {selectedTrainer.email}
                    </Typography>
                  </Box>
                  
                  {selectedTrainer.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Phone size={16} style={{ marginRight: 8, opacity: 0.7 }} />
                      <Typography variant="body2">
                        {selectedTrainer.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Servicios ofrecidos
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle size={16} style={{ marginRight: 8, color: '#4CAF50' }} />
                    <Typography variant="body2">
                      Rutinas personalizadas
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle size={16} style={{ marginRight: 8, color: '#4CAF50' }} />
                    <Typography variant="body2">
                      Seguimiento constante
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle size={16} style={{ marginRight: 8, color: '#4CAF50' }} />
                    <Typography variant="body2">
                      Ajustes en tiempo real
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle size={16} style={{ marginRight: 8, color: '#4CAF50' }} />
                    <Typography variant="body2">
                      Consultas por videollamada
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={() => setDialogOpen(false)}
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => assignTrainer(selectedTrainer.id)}
              disabled={assigning}
              startIcon={assigning ? <CircularProgress size={16} /> : <CheckCircle size={16} />}
            >
              {assigning ? 'Asignando...' : 'Seleccionar Entrenador'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Instrucciones */}
      <Box sx={{ mt: 6, textAlign: 'center', p: 3, background: 'rgba(0, 131, 143, 0.05)', borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          ¿Cómo funciona?
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%',
                background: 'rgba(0, 131, 143, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#00838F'
              }}>
                <User size={24} />
              </Box>
              <Typography variant="body2" fontWeight="medium">
                1. Busca y selecciona
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Encuentra el entrenador que mejor se adapte a tus necesidades
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%',
                background: 'rgba(0, 131, 143, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#00838F'
              }}>
                <CheckCircle size={24} />
              </Box>
              <Typography variant="body2" fontWeight="medium">
                2. Solicita asesoría
              </Typography>
              <Typography variant="caption" color="text-secondary">
                El entrenador revisará tu perfil y rutina actual
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%',
                background: 'rgba(0, 131, 143, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#00838F'
              }}>
                <Video size={24} />
              </Box>
              <Typography variant="body2" fontWeight="medium">
                3. Comienza tu transformación
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sesiones personalizadas y seguimiento constante
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default BuscarEntrenadores;