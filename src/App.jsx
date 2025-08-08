// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/loginPage';
import RegisterPage from './components/RegisterPage';
import { Box } from '@mui/material'; // Importamos Box para usarlo en App.jsx
import './App.css'; // Si tienes un CSS global, este es el lugar para importarlo

function App() {
  return (
    <Router>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#2b2b2b', // Un color de fondo oscuro para que se parezca a tu imagen
          width: '100%', // Aseguramos que ocupe todo el ancho
        }}
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;