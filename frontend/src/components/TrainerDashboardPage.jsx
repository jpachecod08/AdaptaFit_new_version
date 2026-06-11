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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  CircularProgress,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Badge,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  Person,
  FitnessCenter,
  TrendingUp,
  Warning,
  Videocam,
  Edit,
  Visibility,
  AccessTime,
  Logout,
  MoreVert,
  Phone,
  Schedule,
  CheckCircle,
  Cancel,
  Add,
  Delete,
  Save,
  Close,
  Settings,
  Menu as MenuIcon,
  AccountCircle,
  CalendarToday,
  Email,
  SportsGymnastics,
  EditCalendar
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const TrainerDashboardPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editedPlan, setEditedPlan] = useState(null);
  const [videoLink, setVideoLink] = useState('');
  const [editingExercise, setEditingExercise] = useState(null);

  // Menú de usuario
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  // Función para obtener el token
  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? `Token ${token}` : null;
  };

  useEffect(() => {
    const verifyAndFetch = async () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        setTimeout(() => navigate('/login'), 2000);
        setLoading(false);
        return;
      }

      if (userRole !== 'entrenador') {
        setError('Solo los entrenadores pueden acceder a esta página.');
        setTimeout(() => navigate('/dashboard'), 2000);
        setLoading(false);
        return;
      }

      await fetchClients();
    };

    verifyAndFetch();
  }, [navigate]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      
      if (!authHeader) {
        setError('Token no encontrado. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/trainer/clients/`, {
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      setClients(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching clients:', err);
      if (err.response?.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        if (onLogout) onLogout();
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('No tienes permisos de entrenador.');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setError('Error al cargar clientes: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const viewClientDetails = async (clientId) => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/api/users/trainer/clients/${clientId}/`, {
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      setSelectedClient(response.data);
      setEditedPlan(response.data.current_plan);
      setViewDialogOpen(true);
    } catch (err) {
      setError('Error al cargar detalles del cliente: ' + err.message);
    }
  };

  const regeneratePlan = async (clientId) => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(
        `${API_URL}/api/users/trainer/clients/${clientId}/update-plan/`,
        { action: 'regenerate' },
        { 
          headers: { 
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccess('Plan regenerado exitosamente');
      fetchClients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al regenerar plan: ' + err.message);
    }
  };

  const updateExercise = async (clientId, exerciseId, updatedData) => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(
        `${API_URL}/api/users/trainer/clients/${clientId}/update-plan/`,
        {
          action: 'update_exercise',
          exercise_id: exerciseId,
          ...updatedData
        },
        { 
          headers: { 
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccess('Ejercicio actualizado exitosamente');
      // Actualizar el plan editado localmente
      if (editedPlan) {
        const updatedPlan = { ...editedPlan };
        updatedPlan.days.forEach(day => {
          day.exercises.forEach(exercise => {
            if (exercise.id === exerciseId) {
              Object.assign(exercise, updatedData);
            }
          });
        });
        setEditedPlan(updatedPlan);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al actualizar ejercicio: ' + err.message);
    }
  };

  const startVideoCall = async (clientId) => {
    try {
      // Generar un enlace de video único (en producción usarías un servicio como Daily.co, Zoom, etc.)
      const roomId = `adaptafit-${clientId}-${Date.now()}`;
      const videoUrl = `https://meet.jit.si/${roomId}`;
      
      setVideoLink(videoUrl);
      setVideoDialogOpen(true);
      
      // Opcional: Enviar notificación al cliente (necesitarías implementar WebSockets o notificaciones push)
      const authHeader = getAuthHeader();
      await axios.post(
        `${API_URL}/api/users/trainer/notify-videocall/`,
        {
          client_id: clientId,
          video_link: videoUrl,
          timestamp: new Date().toISOString()
        },
        { 
          headers: { 
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (err) {
      console.error('Error al iniciar videollamada:', err);
      // Fallback: usar enlace simple
      setVideoLink(`https://meet.jit.si/adaptafit-${clientId}`);
      setVideoDialogOpen(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin actividad';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
  };

  const handleSaveExercise = () => {
    if (editingExercise && selectedClient) {
      updateExercise(selectedClient.client.id, editingExercise.id, editingExercise);
      setEditingExercise(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* AppBar Superior */}
      <AppBar position="static" sx={{ bgcolor: '#1a237e', boxShadow: 2 }}>
        <Toolbar>
          <SportsGymnastics sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            AdaptaFit - Panel de Entrenador
          </Typography>

          {/* Menú de usuario */}
          <Tooltip title="Menú de usuario">
            <IconButton
              color="inherit"
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ ml: 1 }}
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 180,
                boxShadow: '0px 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <MenuItem disabled>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Mi Cuenta" 
                secondary={localStorage.getItem('userEmail') || 'Entrenador'}
              />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => navigate('/editar-perfil')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Configuración" />
            </MenuItem>
            <MenuItem onClick={() => {
              onLogout();
              navigate('/login');
            }} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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

        {/* Resumen de Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1a237e', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 2, fontSize: 40, opacity: 0.8 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {clients.length}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Clientes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#2e7d32', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FitnessCenter sx={{ mr: 2, fontSize: 40, opacity: 0.8 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {clients.filter(c => c.completed_today > 0).length}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Activos Hoy
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ed6c02', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Warning sx={{ mr: 2, fontSize: 40, opacity: 0.8 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {clients.filter(c => c.needs_attention).length}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Necesitan Atención
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#9c27b0', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 2, fontSize: 40, opacity: 0.8 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {clients.length > 0 
                      ? Math.round(clients.reduce((sum, c) => sum + (c.current_streak || 0), 0) / clients.length)
                      : 0
                    }
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Racha Promedio (días)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabla de Clientes */}
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Mis Clientes
              </Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  startIcon={<AccessTime />}
                  onClick={fetchClients}
                  sx={{ mr: 1 }}
                >
                  Actualizar
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<CalendarToday />}
                  onClick={() => alert('Funcionalidad de calendario - Próximamente')}
                >
                  Ver Calendario
                </Button>
              </Box>
            </Box>

            {clients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Person sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aún no tienes clientes asignados
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                  Los usuarios pueden solicitar tu asesoría desde la sección "Buscar Entrenador" en su perfil
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/editar-perfil')}
                >
                  Completar Mi Perfil
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Cliente</strong></TableCell>
                      <TableCell><strong>Plan Actual</strong></TableCell>
                      <TableCell><strong>Progreso Hoy</strong></TableCell>
                      <TableCell><strong>Racha</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell><strong>Última Actividad</strong></TableCell>
                      <TableCell><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: '#1a237e' }}>
                              {client.name?.charAt(0)?.toUpperCase() || 'C'}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="medium">
                                {client.name || client.email?.split('@')[0] || 'Sin nombre'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <Email fontSize="small" sx={{ mr: 0.5, fontSize: 14, verticalAlign: 'middle' }} />
                                {client.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {client.plan_name || 'Sin plan'}
                          </Typography>
                          <Chip 
                            size="small"
                            label={`${client.frequency || 3}x/semana`}
                            sx={{ mt: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={((client.completed_today || 0) / (client.total_exercises || 1)) * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                            <Typography variant="body2" color="primary" fontWeight="medium">
                              {client.completed_today || 0}/{client.total_exercises || 0}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<TrendingUp />}
                            label={`${client.current_streak || 0} días`}
                            color={client.current_streak > 7 ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={client.status === 'active' ? 'Activo' : 'Inactivo'}
                            color={getStatusColor(client.status)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          {client.needs_attention && (
                            <Tooltip title="Sin actividad en 3+ días">
                              <Chip 
                                icon={<Warning />}
                                label="Atención"
                                color="warning"
                                size="small"
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(client.last_activity)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Ver detalles">
                              <IconButton 
                                size="small" 
                                onClick={() => viewClientDetails(client.id)}
                                color="primary"
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Regenerar plan">
                              <IconButton 
                                size="small"
                                onClick={() => regeneratePlan(client.id)}
                                color="secondary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Videollamada">
                              <IconButton 
                                size="small"
                                onClick={() => startVideoCall(client.id)}
                                sx={{ color: '#2e7d32' }}
                              >
                                <Videocam />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Más opciones">
                              <IconButton 
                                size="small"
                                onClick={(e) => {
                                  setAnchorEl(e.currentTarget);
                                  setSelectedClient(client);
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Menú contextual */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => {
            setAnchorEl(null);
            if (selectedClient) viewClientDetails(selectedClient.id);
          }}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            Ver Detalles Completos
          </MenuItem>
          <MenuItem onClick={() => {
            setAnchorEl(null);
            if (selectedClient) regeneratePlan(selectedClient.id);
          }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Editar Rutina Completa
          </MenuItem>
          <MenuItem onClick={() => {
            setAnchorEl(null);
            if (selectedClient) startVideoCall(selectedClient.id);
          }}>
            <ListItemIcon>
              <Videocam fontSize="small" />
            </ListItemIcon>
            Programar Videollamada
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Cancel fontSize="small" color="error" />
            </ListItemIcon>
            Cancelar
          </MenuItem>
        </Menu>
      </Container>

      {/* Diálogo de Detalles del Cliente */}
      {selectedClient && (
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'white', color: '#1a237e' }}>
                  {selectedClient.client.nombre?.charAt(0)?.toUpperCase() || 'C'}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedClient.client.nombre || selectedClient.client.email}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Cliente desde {formatDate(selectedClient.client.date_joined)}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setViewDialogOpen(false)} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="Información" icon={<Person />} iconPosition="start" />
              <Tab label="Rutina Actual" icon={<FitnessCenter />} iconPosition="start" />
              <Tab label="Historial" icon={<TrendingUp />} iconPosition="start" />
            </Tabs>

            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                    Información Personal
                  </Typography>
                  <Box sx={{ '& > *': { mb: 1 } }}>
                    <Typography><strong>Email:</strong> {selectedClient.client.email}</Typography>
                    {selectedClient.client.profile?.objetivo && (
                      <Typography><strong>Objetivo:</strong> {selectedClient.client.profile.objetivo}</Typography>
                    )}
                    {selectedClient.client.profile?.experiencia && (
                      <Typography><strong>Experiencia:</strong> {selectedClient.client.profile.experiencia}</Typography>
                    )}
                    {selectedClient.client.profile?.frecuencia && (
                      <Typography><strong>Frecuencia:</strong> {selectedClient.client.profile.frecuencia} días/semana</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                    Estadísticas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd', borderRadius: 2 }}>
                        <Typography variant="h4" color="primary">
                          {selectedClient.stats.current_streak || 0}
                        </Typography>
                        <Typography variant="caption">Días consecutivos</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5', borderRadius: 2 }}>
                        <Typography variant="h4" color="secondary">
                          {selectedClient.stats.total_points || 0}
                        </Typography>
                        <Typography variant="caption">Puntos totales</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && editedPlan && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#1a237e' }}>
                    {editedPlan.title}
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<EditCalendar />}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    Editar Rutina
                  </Button>
                </Box>
                
                <Typography variant="body2" paragraph>
                  {editedPlan.description}
                </Typography>
                
                {editedPlan.days && editedPlan.days.map((day, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {day.name || `Día ${day.day_number}`}
                    </Typography>
                    {day.exercises && day.exercises.map((exercise, exIndex) => (
                      <Box key={exIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                        <SportsGymnastics sx={{ mr: 2, color: '#1a237e' }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight="medium">{exercise.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.rest_time && ` • Descanso: ${exercise.rest_time}s`}
                          </Typography>
                        </Box>
                        <Tooltip title="Editar ejercicio">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditExercise(exercise)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </Paper>
                ))}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                  Historial de Entrenamientos
                </Typography>
                {selectedClient.recent_workouts && selectedClient.recent_workouts.length > 0 ? (
                  selectedClient.recent_workouts.map((workout, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle color="success" sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="body2">
                            <strong>{workout.exercise_name}</strong> completado
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(workout.date)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Alert severity="info">No hay historial de entrenamientos</Alert>
                )}
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Button onClick={() => setViewDialogOpen(false)}>
              Cerrar
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Videocam />}
              onClick={() => {
                setViewDialogOpen(false);
                startVideoCall(selectedClient.client.id);
              }}
            >
              Iniciar Videollamada
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Diálogo de Edición de Rutina */}
      {selectedClient && editedPlan && (
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Editar Rutina</Typography>
              <IconButton onClick={() => setEditDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>
              Editar ejercicios para {selectedClient.client.nombre}
            </Typography>
            
            {editingExercise ? (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre del ejercicio"
                  value={editingExercise.name}
                  onChange={(e) => setEditingExercise({...editingExercise, name: e.target.value})}
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Sets"
                      type="number"
                      value={editingExercise.sets}
                      onChange={(e) => setEditingExercise({...editingExercise, sets: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Repeticiones"
                      type="number"
                      value={editingExercise.reps}
                      onChange={(e) => setEditingExercise({...editingExercise, reps: e.target.value})}
                    />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  label="Tiempo de descanso (segundos)"
                  type="number"
                  value={editingExercise.rest_time}
                  onChange={(e) => setEditingExercise({...editingExercise, rest_time: e.target.value})}
                  sx={{ mt: 2 }}
                />
                <TextField
                  fullWidth
                  label="Notas"
                  multiline
                  rows={2}
                  value={editingExercise.notes || ''}
                  onChange={(e) => setEditingExercise({...editingExercise, notes: e.target.value})}
                  sx={{ mt: 2 }}
                />
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button onClick={() => setEditingExercise(null)}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleSaveExercise}
                  >
                    Guardar Cambios
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography>Selecciona un ejercicio para editar</Typography>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Videollamada */}
      <Dialog 
        open={videoDialogOpen} 
        onClose={() => setVideoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Videocam sx={{ mr: 2 }} />
            <Typography variant="h6">Videollamada</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body1" paragraph>
            Enlace de videollamada generado. Comparte este enlace con tu cliente:
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 3 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {videoLink}
            </Typography>
          </Paper>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Recomendamos usar <strong>Jitsi Meet</strong> (integrado) o <strong>Zoom</strong> para videollamadas profesionales.
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
              variant="contained" 
              color="success"
              href={videoLink}
              target="_blank"
              startIcon={<Videocam />}
            >
              Unirse a la Videollamada
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigator.clipboard.writeText(videoLink)}
            >
              Copiar Enlace
            </Button>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVideoDialogOpen(false)}>
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Aquí implementarías la integración con Zoom/Google Meet si lo prefieres
              alert('Integración con Zoom/Google Meet - Próximamente');
            }}
          >
            Usar Zoom/Meet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainerDashboardPage;