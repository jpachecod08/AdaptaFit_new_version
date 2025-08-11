import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  List,
  ListItem,
  Button,
  Box,
  CircularProgress,
  TextField,
  IconButton,
  Card,
  CardContent,
  styled,
  useTheme,
  Grid,
  CssBaseline,
} from '@mui/material';
import {
  Dumbbell,
  Calendar,
  ListChecks,
  ChevronLeft,
  MessageCircle,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import axios from 'axios';

// Utilitarios de autenticación
const getAuthToken = (navigate) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    navigate('/login');
    throw new Error('No autenticado');
  }
  return token;
};

// Componentes estilizados
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  fontWeight: 'bold',
  textTransform: 'none',
  padding: '8px 16px',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const MessageBase = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  padding: '1rem',
  borderRadius: '1rem',
  animation: 'fadeIn 0.5s ease-in-out',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
});

const AiMessage = styled(MessageBase)({
  backgroundColor: '#e0f7fa',
  border: '1px solid #b2ebf2',
});

const UserMessage = styled(MessageBase)({
  backgroundColor: '#fafafa',
  border: '1px solid #e0e0e0',
});

// Componente principal
const MiRutina = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const chatEndRef = useRef(null);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken(navigate);
        
        // Cargar plan
        const planResponse = await axios.get(`http://localhost:8000/api/workouts/plans/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        // Cargar chat guardado
        const savedChat = localStorage.getItem(`chatHistory-${id}`);
        
        setPlan(planResponse.data);
        if (savedChat) setChatHistory(JSON.parse(savedChat));
      } catch (err) {
        console.error('Error:', err);
        setFetchError(err.response?.data?.detail || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, navigate]);

  // Auto-scroll del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const toggleCompleted = (exerciseId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const handleAiQuery = useCallback(async () => {
    if (!aiPrompt.trim() || aiLoading) return;

    try {
      const token = getAuthToken(navigate);
      const userMessage = { 
        role: 'user', 
        text: aiPrompt, 
        id: Date.now() 
      };

      // Actualización optimista del chat
      setChatHistory(prev => {
        const updatedChat = [...prev, userMessage];
        localStorage.setItem(`chatHistory-${id}`, JSON.stringify(updatedChat));
        return updatedChat;
      });

      setAiPrompt('');
      setAiLoading(true);

      const response = await axios.post(
        `http://localhost:8000/api/workouts/chat-asistente/`,
        { prompt: aiPrompt },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          }
        }
      );

      setChatHistory(prev => {
        const answer = {
          role: 'gemini',
          text: response.data?.answer || "No pude generar una respuesta.",
          id: Date.now() + 1
        };
        const updatedChat = [...prev, answer];
        localStorage.setItem(`chatHistory-${id}`, JSON.stringify(updatedChat));
        return updatedChat;
      });

    } catch (error) {
      if (error.message !== 'No autenticado') {
        setChatHistory(prev => [...prev, {
          role: 'gemini',
          text: "Error al conectar con el asistente. Intenta nuevamente.",
          id: Date.now()
        }]);
      }
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, aiLoading, id, navigate]);

  // Componente de ejercicio memoizado
  const ExerciseItem = React.memo(({ ex, completed, onClick }) => (
    <ListItem
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        alignItems: 'center',
        p: 2,
        mb: 1,
        borderRadius: 2,
        backgroundColor: completed ? '#e8f5e9' : '#fafafa',
        borderLeft: `5px solid ${completed ? theme.palette.success.main : theme.palette.primary.main}`,
        transition: 'background-color 0.3s, transform 0.2s',
        '&:hover': {
          transform: 'scale(1.01)',
          backgroundColor: completed ? '#dcedc8' : '#f0f0f0',
        },
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="body1"
          fontWeight="bold"
          sx={{
            textDecoration: completed ? 'line-through' : 'none',
            color: completed ? 'gray' : 'inherit',
          }}
        >
          {ex.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {ex.sets} sets x {ex.reps} reps • Descanso: {ex.rest_seconds || 0}s
        </Typography>
        {ex.notes && <Typography variant="caption" sx={{ fontStyle: 'italic' }}>{ex.notes}</Typography>}
      </Box>
      <StyledButton
        size="small"
        onClick={onClick}
        sx={{
          backgroundColor: completed ? theme.palette.success.main : '#00838F',
          color: 'white',
          '&:hover': {
            backgroundColor: completed ? '#388e3c' : '#006064',
          },
        }}
        startIcon={completed ? <CheckCircle2 /> : <ListChecks />}
      >
        {completed ? 'Completado' : 'Marcar'}
      </StyledButton>
    </ListItem>
  ));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#00838F' }} />
      </Box>
    );
  }

  if (!plan || fetchError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          <XCircle size={32} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {fetchError || 'Plan de entrenamiento no encontrado.'}
        </Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <React.Fragment>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        py: { xs: 3, md: 6 },
        fontFamily: 'Roboto, sans-serif',
      }}>
        {/* Encabezado */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, px: { xs: 2, md: 4 } }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2, color: '#00838F' }}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#00838F' }}>
            Mi Rutina de Entrenamiento
          </Typography>
        </Box>

        {/* Contenido principal */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ px: { xs: 2, md: 4 } }}>
          {/* Columna de rutina */}
          <Grid item xs={12} md={6}>
            <Card elevation={8} sx={{ 
              borderRadius: 4, 
              background: `linear-gradient(135deg, #00838F 10%, #004d40 90%)`, 
              color: 'white', 
              mb: 4 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Dumbbell size={32} style={{ marginRight: '1rem' }} />
                  <Typography variant="h5" fontWeight="bold">
                    {plan.title || 'Plan de Entrenamiento'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Generado: {new Date(plan.generated_at).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>

            <Paper elevation={4} sx={{ borderRadius: 4, p: { xs: 3, md: 4 } }}>
              {plan.days.map((day) => (
                <Box key={day.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Calendar size={20} color="#00838F" />
                    <Typography variant="h6" fontWeight="bold" sx={{ ml: 1, color: '#00838F' }}>
                      {day.name || `Día ${day.day_index + 1}`}
                    </Typography>
                  </Box>
                  <List disablePadding>
                    {day.exercises.map((ex) => (
                      <ExerciseItem
                        key={ex.id}
                        ex={ex}
                        completed={completedExercises[ex.id]}
                        onClick={() => toggleCompleted(ex.id)}
                      />
                    ))}
                  </List>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Columna de chat */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mt: { xs: 4, md: 0 } }}>
              <Card elevation={8} sx={{ 
                borderRadius: 4, 
                background: `linear-gradient(45deg, #FFD700 30%, #FFA500 90%)`, 
                color: 'white', 
                mb: 4 
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MessageCircle size={32} style={{ marginRight: '1rem' }} />
                    <Typography variant="h5" fontWeight="bold">
                      Asistente de Entrenamiento
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Obtén consejos personalizados sobre tu rutina
                  </Typography>
                </CardContent>
              </Card>

              <Paper elevation={4} sx={{ 
                borderRadius: 4, 
                p: { xs: 3, md: 4 }, 
                display: 'flex', 
                flexDirection: 'column',
                height: 'calc(100% - 120px)'
              }}>
                <Box sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  mb: 2,
                  maxHeight: '60vh'
                }}>
                  {chatHistory.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      color: 'text.secondary', 
                      mt: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <Sparkles size={60} style={{ color: '#00838F' }} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        ¡Hola! Estoy aquí para ayudarte con tu rutina.
                      </Typography>
                      <Typography variant="body2">
                        ¿En qué puedo ayudarte hoy?
                      </Typography>
                    </Box>
                  ) : (
                    chatHistory.map((msg) => (
                      <Box 
                        key={msg.id}
                        sx={{ 
                          mb: 2, 
                          display: 'flex', 
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
                        }}
                      >
                        {msg.role === 'user' ? (
                          <UserMessage sx={{ maxWidth: '80%', background: '#00838F', color: 'white' }}>
                            <Typography variant="body2">{msg.text}</Typography>
                          </UserMessage>
                        ) : (
                          <AiMessage sx={{ 
                            maxWidth: '80%', 
                            background: '#b2ebf2', 
                            color: '#004d40',
                            whiteSpace: 'pre-wrap'
                          }}>
                            <Typography component="div">
                              {msg.text.split('\n').map((para, i) => (
                                <p key={i} style={{ margin: '0.5em 0' }}>{para}</p>
                              ))}
                            </Typography>
                          </AiMessage>
                        )}
                      </Box>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  pt: 2,
                  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Escribe tu pregunta..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                    disabled={aiLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        pr: 0,
                      },
                    }}
                    inputProps={{
                      'aria-label': 'Mensaje para el asistente IA',
                      maxLength: 500
                    }}
                    helperText={aiLoading ? "El asistente está pensando..." : ""}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleAiQuery}
                    disabled={aiLoading || !aiPrompt.trim()}
                    sx={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 2,
                      backgroundColor: '#00838F',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#006064',
                      },
                    }}
                    aria-label="Enviar mensaje"
                  >
                    {aiLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <Send />
                    )}
                  </IconButton>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </React.Fragment>
  );
};

export default MiRutina;