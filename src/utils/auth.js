import { useNavigate } from 'react-router-dom';

// Versión para componentes (hook)
export const useAuth = () => {
  const navigate = useNavigate();
  
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      throw new Error('No autenticado');
    }
    return token;
  };

  return { getAuthToken };
};

// Versión para uso fuera de componentes
export const getAuthToken = (navigate) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    navigate('/login');
    throw new Error('No autenticado');
  }
  return token;
};