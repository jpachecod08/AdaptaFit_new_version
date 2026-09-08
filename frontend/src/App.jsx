import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Code-splitting: cada página se carga bajo demanda (reduce el bundle inicial)
const RegisterPage = lazy(() => import('./components/RegisterPage'));
const LoginPage = lazy(() => import('./components/loginPage'));
const UserDashboardPage = lazy(() => import('./components/UserDashboardPage'));
const TrainerDashboardPage = lazy(() => import('./components/TrainerDashboardPage'));
const MiRutina = lazy(() => import('./pages/MiRutina'));
const EditarPerfil = lazy(() => import('./components/EditarPerfil'));
const BuscarEntrenadores = lazy(() => import('./components/BuscarEntrenadores'));
const MiEntrenador = lazy(() => import('./components/MiEntrenador'));

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f5f5f5',
    fontSize: '1.2rem',
    color: '#555'
  }}>
    Cargando...
  </div>
);

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
    setLoadingAuth(false);
  }, []);

  const handleLogin = (token, role) => {
    if (!token || !role) {
      alert('Error: No se recibieron credenciales completas');
      return;
    }

    // Actualizar estado
    setAuth({
      isAuthenticated: true,
      token,
      role,
    });

    // Asegurarse de que se guarda en localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    
    // Forzar recarga para que las rutas protegidas se activen
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      token: null,
      role: null,
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  };

  // ✅ Función para manejar actualización del perfil
  const handleProfileUpdate = () => {};

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

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

        {/* Ruta protegida Editar Perfil */}
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

        {/* ✅ NUEVA: Ruta para buscar entrenadores */}
        <Route
          path="/seleccionar-entrenador"
          element={
            <PrivateRoute isAuthenticated={auth.isAuthenticated}>
              {auth.role === 'usuario' ? (
                <BuscarEntrenadores token={auth.token} />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </PrivateRoute>
          }
        />

        {/* ✅ NUEVA: Ruta para ver mi entrenador asignado */}
        <Route
          path="/mi-entrenador"
          element={
            <PrivateRoute isAuthenticated={auth.isAuthenticated}>
              {auth.role === 'usuario' ? (
                <MiEntrenador token={auth.token} />
              ) : (
                <Navigate to="/dashboard" />
              )}
            </PrivateRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;