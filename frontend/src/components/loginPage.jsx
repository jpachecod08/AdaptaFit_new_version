import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, Dumbbell, Loader2, AlertCircle,
  TrendingUp, Users, Trophy, Flame, ArrowRight, CheckCircle,
} from "lucide-react";
import axios from 'axios';
import { API_URL } from '../config';

const LoginPage = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginUrl = `${API_URL}/api/users/login/`;
      const response = await axios.post(
        loginUrl,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', response.data.tipo_usuario);
      localStorage.setItem('userData', JSON.stringify({
        id: response.data.user_id,
        email: response.data.email,
        nombre: response.data.nombre,
        tipo_usuario: response.data.tipo_usuario,
      }));

      if (onLogin && typeof onLogin === 'function') {
        onLogin(response.data.token, response.data.tipo_usuario);
      }
    } catch (error) {
      console.error("Error en login:", error);

      if (error.response) {
        if (error.response.status === 404) {
          setError("URL de login incorrecta. Verifica la configuración.");
        } else if (error.response.status === 400) {
          const data = error.response.data;
          if (data.error) setError(data.error);
          else if (data.details?.email) setError(data.details.email[0]);
          else if (data.details?.password) setError(data.details.password[0]);
          else if (data.details?.non_field_errors) setError(data.details.non_field_errors[0]);
          else if (data.non_field_errors) setError(data.non_field_errors[0]);
          else setError("Email o contraseña incorrectos");
        } else {
          setError(`Error del servidor (${response.status})`);
        }
      } else if (error.request) {
        setError("No se pudo conectar al servidor. Verifica que esté corriendo.");
      } else {
        setError("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

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

        {/* Logo + Marca */}
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
          {/* Ilustración CSS (sin imagen externa) */}
          <div className="mb-8 flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              {/* Círculo principal */}
              <div className="w-56 h-56 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <div className="w-48 h-48 rounded-full bg-slate-900 flex items-center justify-center">
                  <Flame size={80} className="text-lime-400" strokeWidth={1.5} />
                </div>
              </div>
              {/* Íconos flotantes */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-4 -right-4 bg-white text-slate-900 p-3 rounded-2xl shadow-xl"
              >
                <TrendingUp size={24} className="text-emerald-500" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3.5 }}
                className="absolute -bottom-4 -left-4 bg-white text-slate-900 p-3 rounded-2xl shadow-xl"
              >
                <Trophy size={24} className="text-amber-500" />
              </motion.div>
            </motion.div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4 text-center">
            Tu progreso, <br />
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              medido y mejorado
            </span>
          </h1>

          <p className="text-center text-slate-300 max-w-md mx-auto text-lg leading-relaxed">
            Tu entrenador diseña la rutina. Tú solo te enfocas en entrenar
            y registrar tu progreso. Nosotros nos encargamos del resto.
          </p>
        </div>

        {/* Stats decorativos */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          <StatCard icon={<Users size={20} />} label="Clientes" value="+500" />
          <StatCard icon={<Dumbbell size={20} />} label="Rutinas" value="+1.2k" />
          <StatCard icon={<TrendingUp size={20} />} label="Progreso" value="98%" />
        </div>
      </motion.div>

      {/* ================= PANEL DERECHO (Formulario) ================= */}
      <div className="flex items-center justify-center bg-slate-50 p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 lg:p-10"
        >
          {/* Logo móvil (aparece solo en pantallas pequeñas) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-lime-500 p-3 rounded-2xl shadow-lg">
              <Dumbbell size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">AdaptaFit</h2>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-slate-500 text-sm">
              Ingresa tus credenciales para continuar con tu entrenamiento
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl
                             focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100
                             focus:outline-none transition-all disabled:opacity-50 text-slate-900
                             placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
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

            {/* Olvidé mi contraseña */}
            <div className="flex justify-end">
              <a
                href="/password-reset"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

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
                         transition-all flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              ¿Aún no tienes cuenta?
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Registro */}
          <a
            href="/register"
            className="block w-full text-center py-3.5 border-2 border-slate-200 rounded-xl
                       text-slate-700 font-semibold hover:border-emerald-500 hover:text-emerald-600
                       transition-all"
          >
            Crear cuenta nueva
          </a>

          {/* Feature hints */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>Registra tus series y pesos en segundos</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>Alertas automáticas para subir carga</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>Tu rutina siempre lista, sin importar cuándo entrenes</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Componente auxiliar para los stats decorativos del panel izquierdo
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
    <div className="flex justify-center mb-1 text-lime-400">
      {icon}
    </div>
    <p className="text-xl font-extrabold text-white">{value}</p>
    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
  </div>
);

export default LoginPage;