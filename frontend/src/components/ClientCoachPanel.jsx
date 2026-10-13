import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  MessageSquare, Send, Ruler, Award, GitBranch, Target, ClipboardList,
  Plus, Loader2, Check, Eye,
} from 'lucide-react';
import { API_URL } from '../config';
import MonthlyBoardTable from './MonthlyBoardTable';

const COACH_ACTIONS = [
  ['confirm_result', 'Confirmar resultado de serie'],
  ['correct_technique', 'Corregir técnica'],
  ['guide_to_failure', 'Guiar serie al fallo'],
  ['teach_progression', 'Enseñar sobrecarga progresiva'],
  ['reinforce_good', 'Reforzar buena ejecución'],
  ['explain_structure', 'Explicar estructura del entrenamiento'],
  ['update_structure', 'Actualizar estructura de entrenamiento'],
  ['other', 'Otra acción'],
];

const LEARNING_POINTS = [
  ['knows_structure', 'Conoce su estructura'],
  ['executes_correctly', 'Ejecuta correctamente'],
  ['knows_progression', 'Sabe progresar'],
  ['trains_autonomously', 'Entrena con autonomía'],
  ['understands_evolution', 'Su estructura evoluciona'],
];

const CHANGE_TYPES = [
  ['exercise_swap', 'Cambio de ejercicio'],
  ['weight_update', 'Actualización de peso'],
  ['sets_reps_update', 'Cambio de series/reps'],
  ['session_reorder', 'Reordenamiento de sesiones'],
  ['routine_change', 'Cambio de rutina'],
];

const GOALS = [
  ['grasa', 'Pérdida de grasa'],
  ['musculo', 'Ganancia de músculo'],
  ['recomposicion', 'Recomposición corporal'],
];

const Section = ({ icon, title, children, action }) => (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-white font-semibold text-sm">
        {icon} {title}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const ClientCoachPanel = ({ clientId }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = { Authorization: `Token ${token}` };
  const base = `${API_URL}/api/workouts/clients/${clientId}`;

  const [recs, setRecs] = useState([]);
  const [recMsg, setRecMsg] = useState('');
  const [measurements, setMeasurements] = useState([]);
  const [learning, setLearning] = useState(null);
  const [changes, setChanges] = useState([]);
  const [changeForm, setChangeForm] = useState({ change_type: 'exercise_swap', reason: '' });
  const [board, setBoard] = useState(null);
  const [boardForm, setBoardForm] = useState({
    month: new Date().toISOString().slice(0, 7) + '-01',
    goal: 'recomposicion',
    training_block: '',
  });
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [actions, setActions] = useState([]);
  const [actionForm, setActionForm] = useState({ action: 'confirm_result', notes: '' });
  const [guidance, setGuidance] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const safe = async (url) => {
      try { const { data } = await axios.get(url, { headers }); return data; }
      catch { return null; }
    };
    const [r, m, l, c, b, a, g] = await Promise.all([
      safe(`${base}/recommendations/`),
      safe(`${base}/body-measurements/`),
      safe(`${base}/learning-points/`),
      safe(`${base}/structure-changes/`),
      safe(`${base}/monthly-board/`),
      safe(`${base}/coach-actions/`),
      safe(`${base}/coach-guidance/`),
    ]);
    setRecs(r || []);
    setMeasurements(m || []);
    setLearning(l);
    setChanges(c || []);
    setBoard(b);
    setActions(a || []);
    if (g) setGuidance(g.wants_coach_guidance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const sendRec = async () => {
    if (!recMsg.trim()) return;
    setBusy(true);
    try {
      await axios.post(`${base}/recommendations/`, { message: recMsg }, { headers });
      setRecMsg('');
      await load();
    } finally { setBusy(false); }
  };

  const toggleLearning = async (key, value) => {
    try {
      const { data } = await axios.patch(`${base}/learning-points/`, { [key]: value }, { headers });
      setLearning(data);
    } catch { /* silencioso */ }
  };

  const addChange = async () => {
    if (!changeForm.reason.trim()) return;
    setBusy(true);
    try {
      await axios.post(`${base}/structure-changes/`, changeForm, { headers });
      setChangeForm({ change_type: 'exercise_swap', reason: '' });
      await load();
    } finally { setBusy(false); }
  };

  const createBoard = async () => {
    setBusy(true);
    try {
      await axios.post(`${base}/monthly-board/create/`, boardForm, { headers });
      setShowBoardForm(false);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'No se pudo crear el tablero.');
    } finally { setBusy(false); }
  };

  const addAction = async () => {
    setBusy(true);
    try {
      await axios.post(`${base}/coach-actions/`, actionForm, { headers });
      setActionForm({ action: 'confirm_result', notes: '' });
      await load();
    } finally { setBusy(false); }
  };

  const toggleGuidance = async () => {
    try {
      const { data } = await axios.patch(`${base}/coach-guidance/`, { wants_coach_guidance: !guidance }, { headers });
      setGuidance(data.wants_coach_guidance);
    } catch { /* silencioso */ }
  };

  return (
    <div className="space-y-1">
      {/* Orientación del coach */}
      <Section
        icon={<Eye size={16} />}
        title="Orientación del coach en piso"
        action={
          <button
            onClick={toggleGuidance}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              guidance ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {guidance ? 'Acepta orientación' : 'No desea orientación'}
          </button>
        }
      >
        <p className="text-slate-400 text-xs">
          {guidance
            ? 'El cliente acepta rondas y puntos de progreso.'
            : 'Excepción: informar a administración. Registrar igualmente el motivo.'}
        </p>
      </Section>

      {/* Recomendaciones */}
      <Section icon={<MessageSquare size={16} />} title="Recomendaciones / comentarios (RF-10)">
        <div className="flex gap-2 mb-3">
          <input
            value={recMsg}
            onChange={(e) => setRecMsg(e.target.value)}
            placeholder="Escribe una recomendación para el cliente..."
            className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={sendRec}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-bold text-sm flex items-center gap-1 disabled:opacity-60"
          >
            <Send size={14} /> Enviar
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recs.length === 0 && <p className="text-slate-500 text-xs">Sin recomendaciones enviadas.</p>}
          {recs.map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-slate-200 text-sm whitespace-pre-wrap">{r.message}</p>
              <p className="text-slate-500 text-[10px] mt-1">
                {new Date(r.created_at).toLocaleString('es-ES')} · {r.is_read ? 'Leída' : 'No leída'}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Puntos de aprendizaje */}
      <Section icon={<Award size={16} />} title={
        learning ? `Método Enseñando a Entrenar · ${learning.completed_count}/5` : 'Método Enseñando a Entrenar'
      }>
        <div className="space-y-2">
          {LEARNING_POINTS.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-slate-300 text-sm">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(learning?.[k])}
                onChange={(e) => toggleLearning(k, e.target.checked)}
                className="w-5 h-5 accent-lime-400"
              />
            </label>
          ))}
        </div>
      </Section>

      {/* Acciones de progreso (coach) */}
      <Section icon={<ClipboardList size={16} />} title="Acciones de progreso del coach (7)">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <select
            value={actionForm.action}
            onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            {COACH_ACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input
            value={actionForm.notes}
            onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
            placeholder="Nota (opcional)"
            className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={addAction}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-lime-500 text-slate-900 font-bold text-sm disabled:opacity-60 flex items-center gap-1"
          >
            <Plus size={14} /> Registrar
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {actions.length === 0 && <p className="text-slate-500 text-xs">Sin acciones registradas.</p>}
          {actions.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
              <div>
                <p className="text-slate-200 text-xs font-semibold">
                  {COACH_ACTIONS.find(([v]) => v === a.action)?.[1] || a.action}
                </p>
                {a.notes && <p className="text-slate-400 text-xs">{a.notes}</p>}
              </div>
              <span className="text-slate-500 text-[10px] whitespace-nowrap">
                {new Date(a.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Cambios de estructura */}
      <Section icon={<GitBranch size={16} />} title="Cambios de estructura (su estructura evoluciona)">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <select
            value={changeForm.change_type}
            onChange={(e) => setChangeForm({ ...changeForm, change_type: e.target.value })}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            {CHANGE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input
            value={changeForm.reason}
            onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
            placeholder="Motivo que el cliente debe comprender"
            className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={addChange}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-bold text-sm disabled:opacity-60 flex items-center gap-1"
          >
            <Plus size={14} /> Registrar
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {changes.length === 0 && <p className="text-slate-500 text-xs">Sin cambios registrados.</p>}
          {changes.map((c) => (
            <div key={c.id} className="p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="flex justify-between">
                <span className="text-amber-300 text-xs font-semibold uppercase">
                  {c.change_type}
                </span>
                <span className={`text-[10px] ${c.client_acknowledged ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {c.client_acknowledged ? 'Comprendido' : 'Pendiente'}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">{c.reason}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tablero mensual */}
      <Section
        icon={<Target size={16} />}
        title="Tablero de Progreso Mensual"
        action={
          !board && (
            <button
              onClick={() => setShowBoardForm((s) => !s)}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1"
            >
              <Plus size={12} /> Crear tablero
            </button>
          )
        }
      >
        {board ? (
          <MonthlyBoardTable board={board} />
        ) : showBoardForm ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-400">
                Mes (día 1)
                <input
                  type="date"
                  value={boardForm.month}
                  onChange={(e) => setBoardForm({ ...boardForm, month: e.target.value })}
                  className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm"
                />
              </label>
              <label className="text-xs text-slate-400">
                Meta
                <select
                  value={boardForm.goal}
                  onChange={(e) => setBoardForm({ ...boardForm, goal: e.target.value })}
                  className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm"
                >
                  {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            <label className="text-xs text-slate-400 block">
              Bloque de entrenamiento
              <input
                value={boardForm.training_block}
                onChange={(e) => setBoardForm({ ...boardForm, training_block: e.target.value })}
                placeholder="Ej: Tren Inferior (Frecuencia 2)"
                className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm"
              />
            </label>
            <button
              onClick={createBoard}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-bold text-sm disabled:opacity-60 flex items-center gap-1"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} Crear
            </button>
          </div>
        ) : (
          <p className="text-slate-500 text-xs">Este cliente aún no tiene tablero mensual.</p>
        )}
      </Section>

      {/* Medidas corporales */}
      <Section icon={<Ruler size={16} />} title="Medidas corporales del cliente (RF-17)">
        {measurements.length === 0 ? (
          <p className="text-slate-500 text-xs">El cliente aún no registra medidas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="text-left p-1">Fecha</th>
                  <th className="text-right p-1">Peso</th>
                  <th className="text-right p-1">%Grasa</th>
                  <th className="text-right p-1">Músculo</th>
                  <th className="text-right p-1">Cintura</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m) => (
                  <tr key={m.id} className="text-slate-200 border-t border-white/5">
                    <td className="p-1">{m.recorded_at}</td>
                    <td className="text-right p-1">{m.weight_kg ?? '—'}</td>
                    <td className="text-right p-1">{m.body_fat_percentage ?? '—'}</td>
                    <td className="text-right p-1">{m.muscle_mass_kg ?? '—'}</td>
                    <td className="text-right p-1">{m.waist_cm ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
};

export default ClientCoachPanel;
