import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, Dumbbell, TrendingUp, ChevronDown, ArrowUp,
  ArrowLeft, Flame, AlertCircle, Loader2, X,
  History, Info, Target, Save,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const ClientWorkoutPage = ({ token }) => {
  const navigate = useNavigate();
  const headers = { Authorization: `Token ${token}` };

  const [session, setSession] = useState(null);
  const [setsInput, setSetsInput] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' });
  const [finishedAlerts, setFinishedAlerts] = useState([]);
  const [noAssignment, setNoAssignment] = useState(false);

  // 🆕 Acordeones abiertos por defecto (todos)
  const [openAccordions, setOpenAccordions] = useState({});

  useEffect(() => {
    fetchNextSession();
  }, []);

  const fetchNextSession = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/api/workouts/my-next-session/`, { headers });
      setSession(r.data);

      // Inicializar inputs con peso sugerido y sets ya guardados
      const init = {};
      r.data.exercises.forEach(ex => {
        const saved = ex.current_sets || [];
        init[ex.slot_id] = Array.from({ length: ex.target_sets }, (_, i) => {
          const savedSet = saved.find(s => s.set_number === i + 1);
          return {
            reps: savedSet ? savedSet.reps : '',
            weight: savedSet ? savedSet.weight : ex.current_weight_kg,
            saved: !!savedSet,
          };
        });
      });
      setSetsInput(init);
      setNoAssignment(false);
    } catch (e) {
      if (e.response?.status === 404) {
        setNoAssignment(true);
      } else {
        setSnack({ open: true, msg: 'Error al cargar la sesión', sev: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSet = (slotId, idx, field, value) => {
    setSetsInput(prev => {
      const copy = { ...prev };
      copy[slotId] = [...copy[slotId]];
      copy[slotId][idx] = { ...copy[slotId][idx], [field]: value };
      return copy;
    });
  };

  const saveSet = async (slotId, idx) => {
    const s = setsInput[slotId][idx];
    if (s.reps === '' || s.weight === '') {
      setSnack({ open: true, msg: 'Completa reps y peso', sev: 'warning' });
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/workouts/session-log/${session.session_log_id}/add-set/`,
        {
          slot_id: slotId,
          reps_done: parseInt(s.reps),
          weight_used_kg: parseFloat(s.weight),
        },
        { headers }
      );
      setSetsInput(prev => {
        const copy = { ...prev };
        copy[slotId] = [...copy[slotId]];
        copy[slotId][idx] = { ...copy[slotId][idx], saved: true };
        return copy;
      });
      setSnack({ open: true, msg: `Serie ${idx + 1} guardada`, sev: 'success' });
    } catch (e) {
      setSnack({ open: true, msg: 'Error al guardar la serie', sev: 'error' });
    }
  };

  const finishSession = async () => {
    const pending = [];
    Object.entries(setsInput).forEach(([slotId, sets]) => {
      sets.forEach((s, i) => {
        if (!s.saved && s.reps !== '' && s.weight !== '') {
          pending.push({ slotId, idx: i });
        }
      });
    });

    if (pending.length > 0) {
      setSnack({ open: true, msg: `Tienes ${pending.length} serie(s) sin guardar. Guarda primero.`, sev: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const r = await axios.post(
        `${API_URL}/api/workouts/session-log/${session.session_log_id}/finish/`,
        { rpe: 7, notes: '' },
        { headers }
      );
      setFinishedAlerts(r.data.alerts || []);
      setSnack({ open: true, msg: '💪 ¡Sesión completada!', sev: 'success' });
      setTimeout(() => {
        setFinishedAlerts([]);
        fetchNextSession();
      }, 4000);
    } catch (e) {
      setSnack({ open: true, msg: 'Error al cerrar la sesión', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const applyProgression = async (slotId) => {
    try {
      const r = await axios.post(
        `${API_URL}/api/workouts/apply-progression/${slotId}/`,
        {},
        { headers }
      );
      setSnack({ open: true, msg: `🎉 ¡Peso subido a ${r.data.new_weight_kg} kg!`, sev: 'success' });
      fetchNextSession();
    } catch (e) {
      setSnack({ open: true, msg: 'Error al aplicar progresión', sev: 'error' });
    }
  };

  const toggleAccordion = (slotId) => {
    setOpenAccordions(prev => ({
      ...prev,
      [slotId]: prev[slotId] === undefined ? false : !prev[slotId],
    }));
  };

  const goBack = () => navigate('/dashboard');

  // ==================== LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-lime-400 mx-auto mb-4" size={48} />
          <p className="text-slate-300 text-lg font-medium">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // ==================== SIN ASIGNACIÓN ====================
  if (noAssignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={40} className="text-slate-500" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">
            Aún no tienes rutina asignada
          </h2>
          <p className="text-slate-400 mb-6">
            Tu entrenador debe asignarte una rutina manual para empezar.
          </p>
          <button
            onClick={goBack}
            className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all"
          >
            Volver al dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (!session) return null;

  const totalSets = Object.values(setsInput).flat().length;
  const savedSets = Object.values(setsInput).flat().filter(s => s.saved).length;
  const progress = totalSets > 0 ? Math.round((savedSets / totalSets) * 100) : 0;

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
      {/* Blobs decorativos */}
      <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-lime-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* NAVBAR */}
      <nav className="relative z-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="group flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-slate-300 hover:text-emerald-400 shrink-0"
            title="Volver al panel"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-semibold hidden sm:inline">Volver</span>
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-gradient-to-br from-emerald-400 to-lime-400 p-2 rounded-xl shadow-lg shadow-emerald-500/30 shrink-0">
              <Dumbbell size={20} className="text-slate-900" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-extrabold text-base md:text-lg leading-tight truncate">
                Sesión {session.session_label}
                {session.session_focus && ` · ${session.session_focus}`}
              </h1>
              <p className="text-emerald-300 text-xs font-medium uppercase tracking-widest truncate">
                {session.routine_name}
              </p>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-8">

        {/* HEADER DE PROGRESO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 rounded-3xl p-5 md:p-6 mb-6 shadow-2xl shadow-emerald-500/30 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 opacity-10">
            <Dumbbell size={100} className="text-slate-900" strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-white/90" />
              <span className="text-white/90 text-xs font-bold uppercase tracking-widest">
                Sesión {session.session_index + 1} de {session.total_sessions}
              </span>
            </div>

            <h2 className="text-white text-xl md:text-2xl font-extrabold mb-3">
              Tu entrenamiento de hoy
            </h2>

            {session.days_since_last_session !== null && session.days_since_last_session !== undefined && (
              <p className="text-white/90 text-sm mb-3 flex items-center gap-1.5">
                <History size={14} />
                {session.days_since_last_session === 0
                  ? 'Última sesión: hoy'
                  : `Última sesión: hace ${session.days_since_last_session} día${session.days_since_last_session === 1 ? '' : 's'}`}
              </p>
            )}

            <div className="flex items-center justify-between text-white/95 text-sm mb-2">
              <span className="font-semibold">
                {savedSets}/{totalSets} series
              </span>
              <span className="font-bold text-lg">{progress}%</span>
            </div>

            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-slate-900 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* ALERTAS DE PROGRESIÓN AL CERRAR */}
        {finishedAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {finishedAlerts.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-lime-500/20 border border-lime-500/40 flex items-start gap-3"
              >
                <TrendingUp className="text-lime-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-white font-bold">{a.exercise}</p>
                  <p className="text-lime-300 text-sm">{a.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* EJERCICIOS */}
        <div className="space-y-4">
          {session.exercises.map((ex, exIdx) => {
            const isOpen = openAccordions[ex.slot_id] !== false; // abierto por defecto
            const exerciseSets = setsInput[ex.slot_id] || [];
            const savedExSets = exerciseSets.filter(s => s.saved).length;
            const totalExSets = exerciseSets.length;

            return (
              <motion.div
                key={ex.slot_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: exIdx * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all"
              >
                {/* Header del ejercicio (clickable) */}
                <button
                  onClick={() => toggleAccordion(ex.slot_id)}
                  className="w-full p-4 md:p-5 flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center text-slate-900 font-extrabold shrink-0">
                      {ex.order}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          ex.role === 'main'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {ex.role === 'main' ? 'Principal' : 'Secundario'}
                        </span>
                        {ex.ready_to_increase && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-lime-500 text-slate-900 flex items-center gap-1">
                            <ArrowUp size={10} />
                            Sube
                          </span>
                        )}
                      </div>

                      <p className="text-white font-bold truncate">
                        {ex.exercise_name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {savedExSets}/{totalExSets} series guardadas
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Contenido del ejercicio */}
                {isOpen && (
                  <div className="px-4 md:px-5 pb-5 pt-0">
                    {/* Info objetivo */}
                    <div className="p-3 md:p-4 rounded-2xl bg-slate-900/40 border border-white/5 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-lime-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-lime-400">
                          Objetivo
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Series</p>
                          <p className="text-white font-bold">{ex.target_sets}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Reps</p>
                          <p className="text-white font-bold">
                            {ex.target_reps_min}-{ex.target_reps_max}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Peso actual</p>
                          <p className="text-white font-bold">{ex.current_weight_kg} kg</p>
                        </div>
                      </div>
                      {ex.increment_kg > 0 && (
                        <p className="text-slate-400 text-xs mt-2">
                          Al dominar el rango, sube <strong className="text-lime-400">+{ex.increment_kg} kg</strong>
                        </p>
                      )}
                    </div>

                    {/* Imagen del ejercicio */}
                    {ex.image_url && (
                      <div className="mb-4 text-center">
                        <img
                          src={ex.image_url.startsWith('http') ? ex.image_url : `${API_URL}${ex.image_url}`}
                          alt={ex.exercise_name}
                          className="max-w-full max-h-60 rounded-2xl shadow-lg mx-auto"
                        />
                        <p className="text-slate-500 text-xs mt-2">
                          Máquina: {ex.exercise_name}
                        </p>
                      </div>
                    )}

                    {/* Alerta de progresión lista */}
                    {ex.ready_to_increase && (
                      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-lime-500/20 border border-lime-500/40">
                        <div className="flex items-start gap-3 mb-3">
                          <TrendingUp className="text-lime-400 flex-shrink-0 mt-0.5" size={20} />
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">
                              ¡Dominaste este peso!
                            </p>
                            <p className="text-lime-300 text-xs">
                              Sube a {ex.current_weight_kg + ex.increment_kg} kg en la próxima sesión
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => applyProgression(ex.slot_id)}
                          className="w-full bg-gradient-to-r from-amber-500 to-lime-500 hover:from-amber-600 hover:to-lime-600 text-slate-900 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                          Aplicar subida
                        </button>
                      </div>
                    )}

                    {/* Historial de la última sesión */}
                    {ex.last_session_summary?.length > 0 && (
                      <div className="mb-4 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-3">
                        <History className="text-sky-400 flex-shrink-0 mt-0.5" size={16} />
                        <div className="flex-1">
                          <p className="text-sky-300 text-xs font-bold uppercase tracking-widest mb-1">
                            Última vez
                          </p>
                          <p className="text-slate-300 text-sm">
                            {ex.last_session_summary.map(s => `${s.reps}r @ ${s.weight}kg`).join(' · ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Series */}
                    <div className="space-y-2">
                      {exerciseSets.map((s, i) => (
                        <div
                          key={i}
                          className={`p-3 md:p-4 rounded-2xl border transition-all ${
                            s.saved
                              ? 'bg-emerald-500/5 border-emerald-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          {/* Mobile: layout vertical */}
                          <div className="flex items-center justify-between mb-3 md:mb-0 md:hidden">
                            <span className="text-sm font-bold text-white">
                              Serie {i + 1}
                            </span>
                            {s.saved && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                                <CheckCircle size={12} />
                                Guardada
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                            {/* Desktop: label de serie */}
                            <span className="hidden md:block text-sm font-bold text-white min-w-[70px]">
                              Serie {i + 1}
                            </span>

                            {/* Inputs */}
                            <div className="flex gap-2 flex-1">
                              <div className="flex-1 md:flex-none md:w-28">
                                <label className="block text-[10px] md:hidden text-slate-400 mb-1 font-semibold uppercase">
                                  Reps
                                </label>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  placeholder="Reps"
                                  value={s.reps}
                                  onChange={e => updateSet(ex.slot_id, i, 'reps', e.target.value)}
                                  disabled={s.saved}
                                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>

                              <div className="flex-1 md:flex-none md:w-32">
                                <label className="block text-[10px] md:hidden text-slate-400 mb-1 font-semibold uppercase">
                                  Peso (kg)
                                </label>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  placeholder="Peso"
                                  value={s.weight}
                                  onChange={e => updateSet(ex.slot_id, i, 'weight', e.target.value)}
                                  disabled={s.saved}
                                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>

                            {/* Acción */}
                            <div className="mt-2 md:mt-0">
                              {s.saved ? (
                                <div className="hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                                  <CheckCircle size={14} />
                                  Guardada
                                </div>
                              ) : (
                                <button
                                  onClick={() => saveSet(ex.slot_id, i)}
                                  disabled={s.reps === '' || s.weight === ''}
                                  className="w-full md:w-auto px-4 md:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                                >
                                  <Save size={16} />
                                  Guardar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ACCIONES FINALES */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.01 }}
            whileTap={{ scale: saving ? 1 : 0.99 }}
            onClick={finishSession}
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-700 hover:to-lime-600 text-white py-4 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                Cerrando...
              </>
            ) : (
              <>
                <CheckCircle size={22} />
                Cerrar sesión de entrenamiento
              </>
            )}
          </motion.button>

          <button
            onClick={goBack}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft size={18} />
            Salir sin terminar
          </button>
        </div>
      </div>

      {/* SNACKBAR */}
      {snack.open && (
        <div className="fixed bottom-6 right-4 md:right-6 left-4 md:left-auto z-50 max-w-md md:w-auto mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-5 py-4 rounded-2xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl ${
              snack.sev === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
              snack.sev === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
              snack.sev === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
              'bg-slate-500/20 border-slate-500/30 text-slate-300'
            }`}
          >
            {snack.sev === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium text-sm flex-1">{snack.msg}</span>
            <button
              onClick={() => setSnack({ ...snack, open: false })}
              className="hover:opacity-70 shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ClientWorkoutPage;