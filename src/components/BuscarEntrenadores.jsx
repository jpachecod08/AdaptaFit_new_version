import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  CircularProgress,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Rating,
  InputAdornment,
  Paper,
  Slide,
  Grow,
  Fade,
} from '@mui/material';
import { 
  Search, 
  Person, 
  Work, 
  School, 
  Phone, 
  Email, 
  Close,
  FitnessCenter,
  Star,
  ArrowBack,
} from '@mui/icons-material';
import axios from 'axios';
import { styled } from '@mui/material/styles';

// --- Paleta de colores consistente con RegisterPage ---
const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2A2A2A', // Un tono ligeramente más claro para las tarjetas
  primary: '#4CAF50',
  textPrimary: '#E0E0E0',
  textSecondary: '#A0A0A0',
  error: '#FF5252',
};

// Componente estilizado para las tarjetas de entrenador
const StyledCard = styled(Card)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: colors.card,
  color: colors.textPrimary,
  borderRadius: '16px', // Bordes más redondeados
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)', // Efecto de elevación al pasar el mouse
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)', // Sombra más pronunciada
  },
});

const BuscarEntrenadores = ({ token }) => {
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedEntrenador, setSelectedEntrenador] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchEntrenadores = async () => {
      if (!token) {
        setError('No estás autenticado.');
        setLoading(false);
        return;
      }

      try {
        const params = searchTerm ? { search: searchTerm } : {};
        
        const response = await axios.get('http://localhost:8000/api/users/entrenadores/', {
          headers: { Authorization: `Token ${token}` },
          params
        });
        
        setEntrenadores(response.data);
      } catch (err) {
        setError('Error al cargar entrenadores.');
        console.error('Error fetching trainers:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchEntrenadores();
    }, 500); 

    return () => clearTimeout(timer);
  }, [searchTerm, token]);

  const handleOpenDialog = (entrenador) => {
    setSelectedEntrenador(entrenador);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          backgroundColor: colors.background,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}
      >
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h6" color={colors.error}>{error}</Typography>
      </Box>
    );
  }
  
  if (entrenadores.length === 0 && searchTerm !== '') {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: colors.textPrimary }}>
          No se encontraron entrenadores para la búsqueda "{searchTerm}". Intenta con otra búsqueda.
        </Typography>
      </Box>
    );
  }
  
  if (entrenadores.length === 0 && searchTerm === '') {
     return (
      <Box 
        sx={{
          minHeight: '100vh',
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: colors.textPrimary }}>
          ¡No hay entrenadores disponibles en este momento!
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: colors.background, 
        p: { xs: 2, sm: 4, md: 6 },
        color: colors.textPrimary,
      }}
    >
      {/* Encabezado y barra de búsqueda */}
      <Box mb={4} textAlign="center" position="relative">
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          gutterBottom 
          sx={{ 
            color: colors.primary, 
            textShadow: `0 0 10px ${colors.primary}40`, // Sombra suave para resaltar
            animation: 'fadeIn 1s ease-out',
            '@keyframes fadeIn': { '0%': { opacity: 0, transform: 'translateY(-20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
          }}
        >
          Encuentra tu Entrenador Ideal
        </Typography>
        <Typography variant="h6" sx={{ color: colors.textSecondary, mb: 4, animation: 'fadeIn 1.2s ease-out' }}>
          Busca por nombre, especialidad o certificaciones para encontrar al profesional perfecto para ti.
        </Typography>
        <Paper
          elevation={6}
          sx={{
            p: 1,
            borderRadius: '50px',
            maxWidth: '600px',
            mx: 'auto',
            bgcolor: colors.surface,
            animation: 'zoomIn 1s ease-out',
            '@keyframes zoomIn': { '0%': { transform: 'scale(0.8)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar entrenadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.textSecondary }} />
                </InputAdornment>
              ),
              sx: {
                color: colors.textPrimary,
                borderRadius: '50px',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'transparent !important',
                },
                '&.Mui-focused fieldset': {
                  borderColor: `${colors.primary} !important`,
                  borderWidth: '2px',
                },
              },
            }}
          />
        </Paper>
      </Box>

      {/* Lista de entrenadores con animación */}
      <Grid container spacing={4}>
        {entrenadores.map((entrenador, index) => (
          <Grid item xs={12} sm={6} md={4} key={entrenador.id}>
            <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={500 + index * 100}>
              <StyledCard onClick={() => handleOpenDialog(entrenador)}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                    <Avatar
                      sx={{ 
                        width: 120, 
                        height: 120,
                        mb: 2,
                        bgcolor: colors.primary,
                        fontSize: '3.5rem',
                        border: `3px solid ${colors.primary}`, // Borde que resalta
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      {entrenador.nombre_completo?.charAt(0) || <Person fontSize="large" />}
                    </Avatar>
                    
                    <Typography variant="h6" component="div" textAlign="center" fontWeight="bold">
                      {entrenador.nombre_completo}
                    </Typography>
                    
                    {entrenador.trainer_profile?.especialidad && (
                      <Chip 
                        label={entrenador.trainer_profile.especialidad}
                        sx={{ mt: 1, bgcolor: `${colors.primary}20`, color: colors.primary }}
                        icon={<Work fontSize="small" sx={{ color: colors.primary }} />}
                      />
                    )}
                    
                    <Box mt={1} display="flex" alignItems="center">
                      <Rating 
                        value={entrenador.rating_promedio || 0} 
                        precision={0.5} 
                        readOnly 
                        emptyIcon={<Star sx={{ color: colors.textSecondary }} />}
                        icon={<Star sx={{ color: colors.primary }} />}
                      />
                      <Typography variant="body2" sx={{ ml: 1, color: colors.textSecondary }}>
                        ({entrenador.rating_promedio ? entrenador.rating_promedio.toFixed(1) : '0.0'})
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2, bgcolor: colors.textSecondary }} />
                  <Box sx={{ mb: 2 }}>
                    {entrenador.trainer_profile?.anosExperiencia && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: colors.textSecondary }}>
                        <FitnessCenter fontSize="small" sx={{ mr: 1, color: colors.primary }} />
                        {entrenador.trainer_profile.anosExperiencia} años de experiencia
                      </Typography>
                    )}
                    {entrenador.trainer_profile?.certificaciones && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: colors.textSecondary }}>
                        <School fontSize="small" sx={{ mr: 1, color: colors.primary }} />
                        {entrenador.trainer_profile.certificaciones.split(',').slice(0, 2).join(', ')}
                        {entrenador.trainer_profile.certificaciones.split(',').length > 2 && '...'}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" justifyContent="center" mt="auto">
                    <Button 
                      variant="contained"
                      sx={{ 
                        mt: 2, 
                        borderRadius: '20px',
                        bgcolor: colors.primary,
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#388E3C', // Un verde más oscuro al pasar el mouse
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que el clic en el botón cierre el diálogo
                        handleOpenDialog(entrenador);
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grow>
          </Grid>
        ))}
      </Grid>
      
      {/* Diálogo de detalles con transición de slide */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{
          direction: "up"
        }}
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            color: colors.textPrimary,
            borderRadius: '16px',
          }
        }}
      >
        {selectedEntrenador && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: `1px solid ${colors.textSecondary}50`,
              p: 3,
            }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: colors.primary }}>
                  {selectedEntrenador.nombre_completo}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: colors.textSecondary }}>
                  {selectedEntrenador.trainer_profile?.especialidad}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDialog} sx={{ color: colors.textPrimary }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar
                      sx={{ 
                        width: 150, 
                        height: 150,
                        mb: 3,
                        bgcolor: colors.primary,
                        fontSize: '3.5rem',
                        border: `4px solid ${colors.primary}`,
                      }}
                    >
                      {selectedEntrenador.nombre_completo?.charAt(0)}
                    </Avatar>
                    <Rating 
                      value={selectedEntrenador.rating_promedio || 0} 
                      precision={0.5} 
                      readOnly 
                      size="large"
                      sx={{ mb: 2, '& .MuiRating-iconEmpty': { color: colors.textSecondary } }}
                      icon={<Star sx={{ color: colors.primary }} />}
                    />
                    <Box width="100%">
                      <Typography sx={{ display: 'flex', alignItems: 'center', mb: 1, color: colors.textSecondary }}>
                        <Email sx={{ mr: 1, color: colors.primary }} /> 
                        {selectedEntrenador.email}
                      </Typography>
                      {selectedEntrenador.trainer_profile?.telefono && (
                        <Typography sx={{ display: 'flex', alignItems: 'center', color: colors.textSecondary }}>
                          <Phone sx={{ mr: 1, color: colors.primary }} /> 
                          {selectedEntrenador.trainer_profile.telefono}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  {selectedEntrenador.trainer_profile?.biografia && (
                    <Box mb={3}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">Biografía</Typography>
                      <Typography whiteSpace="pre-line" sx={{ color: colors.textSecondary }}>
                        {selectedEntrenador.trainer_profile.biografia}
                      </Typography>
                    </Box>
                  )}
                  {selectedEntrenador.trainer_profile?.anosExperiencia && (
                    <Typography paragraph sx={{ color: colors.textSecondary }}>
                      <strong>Experiencia:</strong> <span style={{ color: colors.primary, fontWeight: 'bold' }}>{selectedEntrenador.trainer_profile.anosExperiencia}</span> años
                    </Typography>
                  )}
                  {selectedEntrenador.trainer_profile?.certificaciones && (
                    <Box>
                      <Typography variant="h6" gutterBottom fontWeight="bold">Certificaciones</Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {selectedEntrenador.trainer_profile.certificaciones.split(',').map((cert, index) => (
                          <Chip 
                            key={index}
                            label={cert.trim()}
                            icon={<School fontSize="small" sx={{ color: colors.primary }} />}
                            sx={{ bgcolor: `${colors.primary}20`, color: colors.primary }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: `1px solid ${colors.textSecondary}50` }}>
              <Button onClick={handleCloseDialog} sx={{ color: colors.textPrimary }}>Cerrar</Button>
              <Button 
                variant="contained" 
                sx={{
                  bgcolor: colors.primary,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: '#388E3C',
                  },
                }}
                startIcon={<Phone />}
              >
                Contactar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default BuscarEntrenadores;