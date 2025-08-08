import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/loginPage';
import UserDashboardPage from './components/UserDashboardPage';
import TrainerDashboardPage from './components/TrainerDashboardPage';

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  // Estado de autenticación global
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    token: null,
    role: null,
  });

  // Sincronizar estado con localStorage al montar la app
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');

    if (token && role) {
      setAuth({
        isAuthenticated: true,
        token,
        role,
      });
    }
  }, []);

  const handleLogin = (token, role) => {
  if (!token || !role) {
    console.error('Falta token o rol en login');
    return;
  }

  setAuth({
    isAuthenticated: true,
    token,
    role,
  });

  localStorage.setItem('authToken', token);
  localStorage.setItem('userRole', role);
};


  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      token: null,
      role: null,
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/login"
          element={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                backgroundColor: '#f5f5f5',
              }}
            >
              <LoginPage onLogin={handleLogin} />
            </div>
          }
        />

        {/* Ruta protegida */}
        <Route
  path="/dashboard"
  element={
    <PrivateRoute isAuthenticated={auth.isAuthenticated}>
      {auth.role === 'usuario' ? (
        <UserDashboardPage token={auth.token} onLogout={handleLogout} />
      ) : auth.role === 'entrenador' ? (
        <TrainerDashboardPage token={auth.token} onLogout={handleLogout} />
      ) : (
        // Si el rol no es válido, redirigir al login o mostrar mensaje
        <Navigate to="/login" />
      )}
    </PrivateRoute>
  }
/>


        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
