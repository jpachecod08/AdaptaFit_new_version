import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const RegisterPage = lazy(() => import('./components/RegisterPage'));
const LoginPage = lazy(() => import('./components/loginPage'));
const UserDashboardPage = lazy(() => import('./components/UserDashboardPage'));
const TrainerDashboardPage = lazy(() => import('./components/TrainerDashboardPage'));
const MiRutina = lazy(() => import('./pages/MiRutina'));
const EditarPerfil = lazy(() => import('./components/EditarPerfil'));

// 🆕 NUEVAS PÁGINAS
const RoutineBuilderPage = lazy(() => import('./pages/RoutineBuilderPage'));
const ClientWorkoutPage = lazy(() => import('./pages/ClientWorkoutPage'));

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PageLoader = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', width: '100vw', backgroundColor: '#f5f5f5',
    fontSize: '1.2rem', color: '#555'
  }}>
    Cargando...
  </div>
);

function App() {
  const [auth, setAuth] = useState({ isAuthenticated: false, token: null, role: null });
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      setAuth({ isAuthenticated: true, token, role });
    }
    setLoadingAuth(false);
  }, []);

  const handleLogin = (token, role) => {
    if (!token || !role) {
      alert('Error: No se recibieron credenciales completas');
      return;
    }
    setAuth({ isAuthenticated: true, token, role });
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, token: null, role: null });
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  };

  const handleProfileUpdate = () => {};

  if (loadingAuth) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', width: '100vw', backgroundColor: '#f5f5f5', fontSize: '1.5rem',
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

          {/* Dashboard principal */}
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

          {/* 🆕 Rutina manual (solo entrenador) */}
          <Route
            path="/routine-builder"
            element={
              <PrivateRoute isAuthenticated={auth.isAuthenticated}>
                {auth.role === 'entrenador' ? (
                  <RoutineBuilderPage token={auth.token} />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </PrivateRoute>
            }
          />

          {/* 🆕 Entrenamiento del cliente (solo usuario) */}
          <Route
            path="/mi-entrenamiento"
            element={
              <PrivateRoute isAuthenticated={auth.isAuthenticated}>
                {auth.role === 'usuario' ? (
                  <ClientWorkoutPage token={auth.token} />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </PrivateRoute>
            }
          />

          <Route
            path="/editar-perfil"
            element={
              <PrivateRoute isAuthenticated={auth.isAuthenticated}>
                {auth.role === 'usuario' ? (
                  <EditarPerfil token={auth.token} onUpdate={handleProfileUpdate} />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </PrivateRoute>
            }
          />

          <Route
            path="/mi-rutina/:id"
            element={
              <PrivateRoute isAuthenticated={auth.isAuthenticated}>
                {auth.role === 'usuario' ? <MiRutina token={auth.token} /> : <Navigate to="/login" />}
              </PrivateRoute>
            }
          />


          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;