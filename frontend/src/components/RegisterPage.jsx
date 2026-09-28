import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User, Dumbbell, Loader2, AlertCircle,
  Phone, Briefcase, FileText, Target, ArrowRight, CheckCircle,
  Users, Trophy, Flame, TrendingUp,
} from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('usuario');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    biografia: '',
    especialidad: '',
    objetivo: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = role === 'entrenador'
        ? '/api/users/register/trainer/'
        : '/api/users/register/user/';

      const payload = role === 'entrenador'
        ? {
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            trainer_profile: {
              especialidad: formData.especialidad || '',
              certificaciones: '',
              biografia: formData.biografia || '',
              telefono: formData.telefono || '',
            },
          }
        : {
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            profile: {
              objetivo: formData.objetivo || 'mantenerse',
            },
          };

      await axios.post(`${API_URL}${endpoint}`, payload);

      // Redirigir al login
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      console.error('Error en registro:', error);
      const data = error.response?.data;
      if (data?.email) setError(data.email[0]);
      else if (data?.password) setError(data.password[0]);
      else if (data?.nombre) setError(data.nombre[0]);
      else if (data?.error) setError(data.error);
      else setError('Error al crear la cuenta. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  const objetivoOptions = [
    { value: 'perder_peso', label: 'Perder peso' },
    { value: 'ganar_musculo', label: 'Ganar masa muscular' },
    { value: 'mantenerse', label: 'Mantenerse en forma' },
    { value: 'resistencia', label: 'Mejorar la resistencia' },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ================= PANEL IZQUIERDO (Decorativo) ================= */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="hidden lg:flex flex-col justify-between relative overflow-hidden
                   bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900
                   text-white p-12"
      >
        {/* Gradientes decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-400 to-lime-400 p-3 rounded-2xl shadow-lg shadow-emerald-500/30">
              <Dumbbell size={28} className="text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">AdaptaFit</h2>
              <p className="text-xs text-emerald-300 font-medium uppercase tracking-widest">
                Entrenamiento Real
              </p>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 my-8">
          <div className="mb-8 flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              <div className="w-56 h-56 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <div className="w-48 h-48 rounded-full bg-slate-900 flex items-center justify-center">
                  <Users size={80} className="text-lime-400" strokeWidth={1.5} />
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-4 -right-4 bg-white text-slate-900 p-3 rounded-2xl shadow-xl"
              >
                <Trophy size={24} className="text-amber-500" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3.5 }}
                className="absolute -bottom-4 -left-4 bg-white text-slate-900 p-3 rounded-2xl shadow-xl"
              >
                <Flame size={24} className="text-orange-500" />
              </motion.div>
            </motion.div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4 text-center">
            Empieza tu <br />
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              transformación hoy
            </span>
          </h1>

          <p className="text-center text-slate-300 max-w-md mx-auto text-lg leading-relaxed">
            Crea tu cuenta gratis y comienza a entrenar con rutinas diseñadas
            especialmente para ti por entrenadores certificados.
          </p>
        </div>

        {/* Beneficios */}
        <div className="relative z-10 space-y-3">
          <BenefitRow icon={<CheckCircle size={18} />} text="Registra tus series y pesos en segundos" />
          <BenefitRow icon={<CheckCircle size={18} />} text="Alertas automáticas para subir carga" />
          <BenefitRow icon={<CheckCircle size={18} />} text="Tu rutina siempre disponible, sin importar cuándo entrenes" />
        </div>
      </motion.div>

      {/* ================= PANEL DERECHO (Formulario) ================= */}
      <div className="flex items-center justify-center bg-slate-50 p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 my-4"
        >
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-lime-500 p-3 rounded-2xl shadow-lg">
              <Dumbbell size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">AdaptaFit</h2>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              Crear tu cuenta
            </h1>
            <p className="text-slate-500 text-sm">
              Es rápido, fácil y completamente gratis
            </p>
          </div>

          {/* Selector de rol */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('usuario')}
              className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                role === 'usuario'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User size={18} />
              Usuario
            </button>
            <button
              type="button"
              onClick={() => setRole('entrenador')}
              className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                role === 'entrenador'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Dumbbell size={18} />
              Entrenador
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nombre */}
            <InputField
              label="Nombre completo *"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              icon={<User size={18} />}
              required
              disabled={loading}
            />

            {/* Email */}
            <InputField
              label="Correo electrónico *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
              icon={<Mail size={18} />}
              required
              disabled={loading}
            />

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl
                             focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
                             focus:outline-none transition-all disabled:opacity-50 text-slate-900
                             placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Campos específicos por rol */}
            {role === 'usuario' ? (
              <>
                {/* Objetivo (usuario) */}
                <SelectField
                  label="¿Cuál es tu objetivo?"
                  name="objetivo"
                  value={formData.objetivo}
                  onChange={handleChange}
                  icon={<Target size={18} />}
                  options={objetivoOptions}
                  disabled={loading}
                />
              </>
            ) : (
              <>
                {/* Teléfono (entrenador) */}
                <InputField
                  label="Teléfono de contacto"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+57 300 123 4567"
                  icon={<Phone size={18} />}
                  disabled={loading}
                />

                {/* Especialidad (entrenador) */}
                <InputField
                  label="Especialidad *"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  placeholder="Ej: Fuerza y acondicionamiento"
                  icon={<Briefcase size={18} />}
                  required
                  disabled={loading}
                />

                {/* Biografía (entrenador) */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Biografía
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                    <textarea
                      name="biografia"
                      value={formData.biografia}
                      onChange={handleChange}
                      disabled={loading}
                      rows={3}
                      placeholder="Cuéntanos sobre tu experiencia y filosofía de entrenamiento..."
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl
                                 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
                                 focus:outline-none transition-all disabled:opacity-50 text-slate-900
                                 placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Botón */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500
                         hover:from-emerald-700 hover:to-emerald-600
                         disabled:from-emerald-300 disabled:to-emerald-300
                         text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/30
                         transition-all flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              ¿Ya tienes cuenta?
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Login link */}
          <Link
            to="/login"
            className="block w-full text-center py-3.5 border-2 border-slate-200 rounded-xl
                       text-slate-700 font-semibold hover:border-emerald-500 hover:text-emerald-600
                       transition-all"
          >
            Iniciar sesión
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

// ==================== SUB-COMPONENTES ====================

const BenefitRow = ({ icon, text }) => (
  <div className="flex items-center gap-3 text-slate-300">
    <span className="text-lime-400">{icon}</span>
    <span className="text-sm">{text}</span>
  </div>
);

const InputField = ({ label, name, value, onChange, placeholder, icon, type = 'text', required = false, disabled = false }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700 mb-2 block">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl
                   focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
                   focus:outline-none transition-all disabled:opacity-50 text-slate-900
                   placeholder:text-slate-400"
      />
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, icon, options, disabled = false }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700 mb-2 block">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
        {icon}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl
                   focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
                   focus:outline-none transition-all disabled:opacity-50 text-slate-900
                   appearance-none cursor-pointer"
      >
        <option value="">Selecciona una opción...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        ▾
      </div>
    </div>
  </div>
);

export default RegisterPage;