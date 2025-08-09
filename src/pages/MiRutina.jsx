import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Typography, List, ListItem, Button, Box, CircularProgress } from '@mui/material';
import API from './../api/api';

const MiRutina = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para guardar qué ejercicios están completados
  // Usamos un objeto donde la clave es el id del ejercicio
  const [completedExercises, setCompletedExercises] = useState({});

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await API.get(`workouts/plans/${id}/`);
        setPlan(res.data);
      } catch (err) {
        console.error('Error al cargar el plan:', err);
        setPlan(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  const toggleCompleted = (exerciseId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]  // Cambia true/false
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!plan) {
    return (
      <Typography sx={{ mt: 4 }} variant="h6" align="center">
        Plan no encontrado
      </Typography>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">{plan.title}</Typography>
        <Typography variant="caption" display="block" gutterBottom>
          Generado: {new Date(plan.generated_at).toLocaleString()}
        </Typography>

        {plan.days.map((day) => (
          <Box key={day.id} sx={{ mt: 2 }}>
            <Typography variant="h6">{day.name || `Día ${day.day_index + 1}`}</Typography>
            <List>
              {day.exercises.map((ex) => (
                <ListItem key={ex.id} sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <Typography
                      sx={{
                        textDecoration: completedExercises[ex.id] ? 'line-through' : 'none',
                        color: completedExercises[ex.id] ? 'gray' : 'inherit',
                      }}
                    >
                      {ex.name}
                    </Typography>
                    <Typography variant="body2">
                      {ex.sets} x {ex.reps} • descanso {ex.rest_seconds || 0}s
                    </Typography>
                    {ex.notes && <Typography variant="caption">{ex.notes}</Typography>}
                  </div>
                  <div>
                    <Button
                      size="small"
                      variant={completedExercises[ex.id] ? 'contained' : 'outlined'}
                      color={completedExercises[ex.id] ? 'success' : 'primary'}
                      onClick={() => toggleCompleted(ex.id)}
                    >
                      {completedExercises[ex.id] ? 'Completado' : 'Marcar completado'}
                    </Button>
                  </div>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default MiRutina;

