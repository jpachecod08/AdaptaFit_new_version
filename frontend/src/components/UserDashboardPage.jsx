import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dumbbell, LogOut, Play, Edit, TrendingUp, Award, Bell,
  Flame, CheckCircle, Activity, Calendar, User, Trophy,
  ArrowRight, Target, Users, Loader2, ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const UserDashboardPage = ({ token, onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualAssignment, setManualAssignment] = useState(null);
  const [myProgress, setMyProgress] = useState(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [token, navigate]);

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Token ${token}` };

      // 1. Perfil
      const profileResp = await axios.get(`${API_URL}/api/users/profile/`, { headers });
      const user = profileResp.data;
        setUserData({
          id: user.id,
          email: user.email,
          name: user.nombre || user.email.split('@')[0],
          role: user.role,
          es_admin: user.es_admin,
        });


      if (user.role !== 'usuario') {
        onLogout();
        return;
      }

      // 2. Asignación manual
      try {
        const assignResp = await axios.get(`${API_URL}/api/workouts/my-assignment/`, { headers });
        setManualAssignment(assignResp.data);
      } catch (e) {
        if (e.response?.status === 404) setManualAssignment(null);
      }

      // 3. Progreso global
      try {
        const progressResp = await axios.get(`${API_URL}/api/workouts/my-progress/`, { headers });
        setMyProgress(progressResp.data);
        setSessionsCompleted(progressResp.data.total_sessions_completed || 0);
      } catch {
        setMyProgress({ exercises: [], total_sessions_completed: 0 });
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      if (err.response?.status === 401) {
        onLogout();
        navigate('/login');
      } else {
        setError('No se pudieron cargar los datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToWorkout = () => navigate('/mi-entrenamiento');
  const handleEditProfile = () => navigate('/editar-perfil');

  // ==================== LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-lime-400 mx-auto mb-4" size={48} />
          <p className="text-slate-300 text-lg font-medium">Cargando tu espacio...</p>
        </div>
      </div>
    );
  }

  // ==================== ERROR ====================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
        <div className="bg-red-500/10 border-2 border-red-500/30 backdrop-blur-md rounded-3xl p-8 max-w-md w-full text-center">
          <p className="text-red-300 font-semibold mb-4">{error}</p>
          <button
            onClick={onLogout}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold w-full"
          >
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">

      {/* Blobs decorativos */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* ==================== HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center text-slate-900 font-extrabold text-xl shadow-lg shadow-emerald-500/30">
                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-white text-2xl font-extrabold">
                  Hola, {userData?.name} 👋
                </h1>
                <p className="text-slate-400 text-sm">{userData?.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {userData?.es_admin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="h-11 px-4 rounded-xl bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 transition-all flex items-center gap-2 text-amber-300 font-semibold text-sm"
                  title="Panel de administración"
                >
                  <ShieldCheck size={18} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              <button
                onClick={handleEditProfile}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
                title="Editar perfil"
              >
                <Edit size={20} />
              </button>
              <button
                onClick={onLogout}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-red-400"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ==================== RUTINA ASIGNADA ==================== */}
        {manualAssignment ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 rounded-3xl p-8 mb-6 shadow-2xl shadow-emerald-500/30"
          >
            {/* Ícono decorativo de fondo */}
            <div className="absolute top-4 right-4 opacity-20">
              <Dumbbell size={120} className="text-slate-900" strokeWidth={1} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-900/30 backdrop-blur-sm p-2 rounded-xl">
                  <Dumbbell size={24} className="text-white" />
                </div>
                <span className="text-white/90 text-sm font-semibold uppercase tracking-widest">
                  Tu Rutina Asignada
                </span>
              </div>

              <h2 className="text-white text-3xl md:text-4xl font-extrabold mb-3">
                {manualAssignment.routine_name}
              </h2>

              <p className="text-white/90 text-base md:text-lg mb-6 max-w-2xl">
                Próxima sesión: <strong>Sesión {manualAssignment.next_session_label}</strong>
                {' · '}Vas en la sesión {manualAssignment.current_session_index + 1} de {manualAssignment.total_sessions}
              </p>

              <button
                onClick={handleGoToWorkout}
                className="group bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play size={22} className="fill-lime-400 text-lime-400" />
                Comenzar Entrenamiento
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-6 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-700/50 mb-4">
              <Dumbbell size={40} className="text-slate-500" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">
              Aún no tienes una rutina asignada
            </h2>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Pídele a tu entrenador que te asigne una rutina manual. Una vez la tengas,
              podrás empezar a entrenar registrando tus series y pesos.
            </p>
          </motion.div>
        )}

        {/* ==================== STATS CARDS ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<Trophy size={22} />}
            color="emerald"
            value={sessionsCompleted}
            label="Sesiones completadas"
            delay={0.2}
          />
          <StatCard
            icon={<Flame size={22} />}
            color="orange"
            value={myProgress?.exercises?.length || 0}
            label="Ejercicios en seguimiento"
            delay={0.3}
          />
          <StatCard
            icon={<TrendingUp size={22} />}
            color="lime"
            value={myProgress?.exercises?.filter(e => e.ready_to_increase).length || 0}
            label="Listos para subir carga"
            delay={0.4}
          />
        </div>

        {/* ==================== PROGRESO POR EJERCICIO ==================== */}
        {myProgress?.exercises?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400">
                <Activity size={20} className="text-slate-900" />
              </div>
              <h2 className="text-white text-xl font-bold">Tu Progreso por Ejercicio</h2>
            </div>

            <div className="space-y-2">
              {myProgress.exercises.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-white font-semibold text-base">{ex.exercise_name}</p>
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mt-0.5">
                      {ex.muscle_group}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-bold border border-emerald-500/30">
                      {ex.current_weight_kg} kg
                    </span>

                    {ex.times_increased > 0 && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-medium border border-white/10">
                        +{ex.times_increased} subidas
                      </span>
                    )}

                    {ex.ready_to_increase && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-lime-500 text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-500/20">
                        <TrendingUp size={14} />
                        ¡Sube!
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENTE AUXILIAR: StatCard ====================
const StatCard = ({ icon, color, value, label, delay = 0 }) => {
  const colorMap = {
    emerald: { bg: 'from-emerald-400 to-emerald-500', shadow: 'shadow-emerald-500/30', text: 'text-emerald-400' },
    lime:    { bg: 'from-lime-400 to-lime-500',       shadow: 'shadow-lime-500/30',    text: 'text-lime-400' },
    orange:  { bg: 'from-orange-400 to-orange-500',   shadow: 'shadow-orange-500/30',  text: 'text-orange-400' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 hover:border-emerald-500/30 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-slate-900 shadow-lg ${c.shadow}`}>
          {icon}
        </div>
        <div>
          <p className="text-white text-3xl font-extrabold leading-none">{value}</p>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mt-1">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default UserDashboardPage;