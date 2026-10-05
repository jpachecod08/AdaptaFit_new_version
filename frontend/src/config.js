// Backend en Render.
//
// La URL se fija en el codigo porque el valor VITE_API_URL del panel de Netlify
// apuntaba al servicio anterior (adaptafit.onrender.com), que quedo dado de baja
// cuando expiro su base de datos. Asi el frontend no depende de que Netlify
// tenga la variable correcta.
//
// En desarrollo (npm run dev) se usa el backend local.
const BACKEND_PROD = 'https://adaptafit-new-version.onrender.com';
const BACKEND_LOCAL = 'http://localhost:8000';

export const API_URL = (import.meta.env.DEV ? BACKEND_LOCAL : BACKEND_PROD).replace(/\/$/, '');