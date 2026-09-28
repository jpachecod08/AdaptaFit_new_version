import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, User, Target, Phone, Briefcase, FileText,
  Loader2, AlertCircle, CheckCircle, Mail, Dumbbell, X,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const EditarPerfil = ({ token, onUpdate }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    // Usuario
    objetivo: '',
    // Entrenador
    telefono: '',
    especialidad: '',
    biografia: '',
  });

  const [userRole, setUserRole] = useState('usuario');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' });

  // ==================== CARGA INICIAL ====================
  useEffect(() => {
    if (token) fetchUserProfile();
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await axios.get(`${API_URL}/api/users/profile/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const userData = response.data;
      console.log('📋 Datos del perfil:', userData);

      // Detectar rol
      const role = userData.role || 'usuario';
      setUserRole(role);

      const profileData = userData.profile || {};
      const trainerData = userData.trainer_profile || {};

      setFormData({
        nombre: userData.nombre || '',
        email: userData.email || '',
        // Usuario
        objetivo: profileData.objetivo || '',
        // Entrenador
        telefono: trainerData.telefono || '',
        especialidad: trainerData.especialidad || '',
        biografia: trainerData.biografia || '',
      });
    } catch (err) {
      console.error('❌ Error al cargar perfil:', err);
      setSnack({
        open: true,
        msg: 'No se pudieron cargar los datos del perfil',
        sev: 'error',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ==================== GUARDAR ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construir payload según el rol
      let payload;

      if (userRole === 'entrenador') {
        payload = {
          nombre: formData.nombre,
          email: formData.email,
          trainer_profile: {
            especialidad: formData.especialidad,
            telefono: formData.telefono,
            biografia: formData.biografia,
          },
        };
      } else {
        payload = {
          nombre: formData.nombre,
          email: formData.email,
          profile: {
            objetivo: formData.objetivo,
          },
        };
      }

      console.log('📤 Enviando al backend:', payload);

      // 🆕 Usar update-profile endpoint
      const response = await axios.put(
        `${API_URL}/api/users/update-profile/`,
        payload,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      setSnack({
        open: true,
        msg: '✅ Perfil actualizado exitosamente',
        sev: 'success',
      });

      if (onUpdate) onUpdate(response.data);

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('❌ Error al actualizar:', err);
      console.error('Detalles:', err.response?.data);

      let errorMessage = 'Error al actualizar el perfil';
      const data = err.response?.data;
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
          const errors = [];
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) errors.push(`${key}: ${value[0]}`);
            else if (typeof value === 'object') {
              Object.entries(value).forEach(([k, v]) => {
                errors.push(`${k}: ${Array.isArray(v) ? v[0] : v}`);
              });
            } else errors.push(`${key}: ${value}`);
          });
          if (errors.length > 0) errorMessage = errors.join(' | ');
        }
      }

      setSnack({ open: true, msg: errorMessage, sev: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // ==================== LOADING ====================
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-lime-400 mx-auto mb-4" size={48} />
          <p className="text-slate-300 text-lg font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const objetivoOptions = [
    { value: 'perder_peso', label: 'Perder peso' },
    { value: 'ganar_musculo', label: 'Ganar masa muscular' },
    { value: 'mantenerse', label: 'Mantenerse en forma' },
    { value: 'resistencia', label: 'Mejorar la resistencia' },
  ];

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
      {/* Blobs decorativos */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-slate-300 hover:text-emerald-400"
            title="Volver al panel"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-semibold">Volver</span>
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-gradient-to-br from-emerald-400 to-lime-400 p-2 rounded-xl shadow-lg shadow-emerald-500/30 shrink-0">
              <User size={20} className="text-slate-900" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-extrabold text-lg leading-tight truncate">
                Editar Perfil
              </h1>
              <p className="text-emerald-300 text-xs font-medium uppercase tracking-widest truncate">
                {userRole === 'entrenador' ? 'Cuenta de entrenador' : 'Cuenta de usuario'}
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

        {/* Header informativo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
        >
          <h2 className="text-white font-bold text-lg mb-1">Actualiza tu información</h2>
          <p className="text-slate-400 text-sm">
            Mantén tus datos al día para que todo funcione correctamente.
          </p>
        </motion.div>

        {/* Formulario */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8"
        >
          <div className="space-y-6">

            {/* ============ INFORMACIÓN BÁSICA ============ */}
            <div>
              <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <User size={18} className="text-lime-400" />
                Información Básica
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nombre completo *">
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50"
                  />
                </FormField>

                <FormField label="Correo electrónico *">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50"
                  />
                </FormField>
              </div>
            </div>

            {/* ============ CAMPOS SEGÚN ROL ============ */}
            {userRole === 'usuario' ? (
              <>
                <div className="h-px bg-white/10" />

                <div>
                  <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                    <Target size={18} className="text-lime-400" />
                    Tu Objetivo
                  </h3>

                  <FormField label="Objetivo principal">
                    <select
                      name="objetivo"
                      value={formData.objetivo}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-900">Selecciona tu objetivo...</option>
                      {objetivoOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </>
            ) : (
              <>
                <div className="h-px bg-white/10" />

                <div>
                  <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                    <Briefcase size={18} className="text-lime-400" />
                    Información Profesional
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Especialidad *">
                      <input
                        type="text"
                        name="especialidad"
                        value={formData.especialidad}
                        onChange={handleChange}
                        placeholder="Ej: Fuerza y acondicionamiento"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50"
                      />
                    </FormField>

                    <FormField label="Teléfono">
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+57 300 123 4567"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50"
                      />
                    </FormField>
                  </div>

                  <div className="mt-4">
                    <FormField label="Biografía">
                      <textarea
                        name="biografia"
                        value={formData.biografia}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Cuéntanos sobre tu experiencia y filosofía de entrenamiento..."
                        disabled={loading}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50 resize-none"
                      />
                    </FormField>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-900 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Cambios
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>

      {/* Snackbar */}
      {snack.open && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-6 py-4 rounded-2xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl ${
              snack.sev === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
              snack.sev === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
              snack.sev === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
              'bg-slate-500/20 border-slate-500/30 text-slate-300'
            }`}
          >
            {snack.sev === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{snack.msg}</span>
            <button
              onClick={() => setSnack({ ...snack, open: false })}
              className="ml-2 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ==================== SUB-COMPONENTES ====================

const FormField = ({ label, children }) => (
  <div>
    <label className="text-sm font-semibold text-slate-300 mb-2 block">
      {label}
    </label>
    {children}
  </div>
);

export default EditarPerfil;