import React, { useState } from 'react';
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
  ToggleButton, // Importamos ToggleButton
  ToggleButtonGroup, // Importamos ToggleButtonGroup
} from '@mui/material';
import { Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  // Estado para manejar el rol seleccionado (usuario por defecto)
  const [role, setRole] = useState('usuario');

  // Estado para manejar los datos del formulario, ahora con campos para ambos roles
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    // Campos de usuario
    fechaNacimiento: '',
    genero: '',
    altura: '',
    peso: '',
    objetivo: '',
    experiencia: '',
    frecuencia: '',
    lesiones: '',
    // Campos de entrenador
    especialidad: '',
    anosExperiencia: '',
    certificaciones: '',
    biografia: '',
    telefono: '',
  });

  // Maneja el cambio de rol
  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
      // Opcional: limpiar los campos al cambiar de rol para evitar confusiones
      setFormData({
        ...formData,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Datos de registro como ${role}:`, formData);
    // Aquí puedes enviar los datos a tu API para su procesamiento
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ p: 4, mt: 5, borderRadius: 3 }}>
        <Typography variant="h5" textAlign="center" fontWeight="bold" color="#00838F" mb={3}>
          Registro
        </Typography>

        {/* Selector de rol */}
        <ToggleButtonGroup
          value={role}
          exclusive
          onChange={handleRoleChange}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="usuario" sx={{ textTransform: 'none' }}>Registrar como Usuario</ToggleButton>
          <ToggleButton value="entrenador" sx={{ textTransform: 'none' }}>Registrar como Entrenador</ToggleButton>
        </ToggleButtonGroup>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Información Personal común para ambos roles */}
          <Typography variant="h6" mt={2} mb={1}>Datos de Cuenta</Typography>
          <TextField
            label="Nombre Completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            margin="normal"
            autoComplete="off"
          />
          <TextField
            label="Correo Electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            autoComplete="off"
            InputLabelProps={{
              sx: {
                transform: 'translate(14px, 10px) scale(1)', 
                '&.Mui-focused': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
                '&.MuiFormLabel-filled': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
              },
            }}
            InputProps={{
              sx: {
                padding: '12.5px 14px', 
              },
            }}
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            autoComplete="new-password"
            InputLabelProps={{
              sx: {
                transform: 'translate(14px, 10px) scale(1)',
                '&.Mui-focused': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
                '&.MuiFormLabel-filled': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                },
              },
            }}
            InputProps={{
              sx: {
                padding: '12.5px 14px',
              },
            }}
          />

          {/* Renderizado condicional de campos específicos para cada rol */}
          {role === 'usuario' ? (
            <Box>
              <Typography variant="h6" mt={4} mb={1}>Datos para tu Plan de Entrenamiento</Typography>
              <TextField
                label="Fecha de Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                autoComplete="off"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Género</InputLabel>
                <Select name="genero" value={formData.genero} onChange={handleChange}>
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Altura (cm)"
                name="altura"
                type="number"
                value={formData.altura}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <TextField
                label="Peso (kg)"
                name="peso"
                type="number"
                value={formData.peso}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Objetivo Principal</InputLabel>
                <Select name="objetivo" value={formData.objetivo} onChange={handleChange}>
                  <MenuItem value="perder_peso">Perder peso</MenuItem>
                  <MenuItem value="ganar_musculo">Ganar masa muscular</MenuItem>
                  <MenuItem value="mantenerse">Mantenerse en forma</MenuItem>
                  <MenuItem value="resistencia">Mejorar la resistencia</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Nivel de Experiencia</InputLabel>
                <Select name="experiencia" value={formData.experiencia} onChange={handleChange}>
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
                autoComplete="off"
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
                autoComplete="off"
              />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" mt={4} mb={1}>Datos Profesionales del Entrenador</Typography>
              <TextField
                label="Especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              <TextField
                label="Años de Experiencia"
                name="anosExperiencia"
                type="number"
                value={formData.anosExperiencia}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
              />
              <TextField
                label="Número de Teléfono (opcional)"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
            </Box>
          )}
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              backgroundColor: '#00838F',
              '&:hover': { backgroundColor: '#006064' }
            }}
          >
            Registrarse como {role === 'usuario' ? 'Usuario' : 'Entrenador'}
          </Button>
          
          <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/" style={{ textDecoration: 'none' }}>
              <MuiLink component="span" sx={{ color: '#00838F', fontWeight: 'bold' }}>
                Inicia sesión aquí
              </MuiLink>
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;