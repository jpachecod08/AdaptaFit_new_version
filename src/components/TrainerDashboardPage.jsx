import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid
} from '@mui/material';

const TrainerDashboardPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="#00838F">
          Dashboard de Entrenador
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Gestiona a tus clientes y sus planes de entrenamiento.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Mis Clientes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Aquí podrás ver una lista de tus clientes, su progreso y asignarles nuevas rutinas.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TrainerDashboardPage;