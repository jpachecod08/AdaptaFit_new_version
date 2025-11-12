import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/loginPage';
import UserDashboardPage from './components/UserDashboardPage';
import TrainerDashboardPage from './components/TrainerDashboardPage';
import MiRutina from './pages/MiRutina';
import EditarPerfil from './components/EditarPerfil'; // ✅ AÑADIDO

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

  // Estado para saber si estamos cargando la info de autenticación
  const [loadingAuth, setLoadingAuth] = useState(true);

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
    setLoadingAuth(false); // Ya terminó de cargar
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

  // ✅ AÑADIDO: Función para manejar actualización del perfil
  const handleProfileUpdate = (updatedData) => {
    console.log('Perfil actualizado:', updatedData);
    // Aquí puedes actualizar el estado global si es necesario
    // Por ejemplo, si quieres actualizar el nombre en el dashboard
  };

  // Mientras cargamos la autenticación mostramos un mensaje o spinner
  if (loadingAuth) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#f5f5f5',
          fontSize: '1.5rem',
        }}
      >
        Cargando...
      </div>
    );
  }

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

        {/* Ruta protegida dashboard */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute isAuthenticated={auth.isAuthenticated}>
              {auth.role === 'usuario' ? (
                <UserDashboardPage token={auth.token} onLogout={handleLogout} />
              ) : auth.role === 'entrenador' ? (
                <TrainerDashboardPage token={auth.token} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )}
            </PrivateRoute>
          }
        />

        {/* ✅ AÑADIDO: Ruta protegida Editar Perfil */}
        <Route
          path="/editar-perfil"
          element={
            <PrivateRoute isAuthenticated={auth.isAuthenticated}>
              {auth.role === 'usuario' ? (
                <EditarPerfil 
                  token={auth.token} 
                  onUpdate={handleProfileUpdate} 
                />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </PrivateRoute>
          }
        />

        {/* Ruta protegida MiRutina */}
        <Route
          path="/mi-rutina/:id"
          element={
            <PrivateRoute isAuthenticated={auth.isAuthenticated}>
              {auth.role === 'usuario' ? <MiRutina token={auth.token} /> : <Navigate to="/login" />}
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