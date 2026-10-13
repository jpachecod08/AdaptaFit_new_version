import React from 'react';

const GOAL_LABELS = {
  grasa: 'Pérdida de grasa',
  musculo: 'Ganancia de músculo',
  recomposicion: 'Recomposición corporal',
};

const PHASE_STYLES = {
  impacto: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  descarga: { border: 'border-sky-500/40', bg: 'bg-sky-500/10', text: 'text-sky-300' },
  potencia: { border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-300' },
};

const ROLE_LABELS = { main: 'Principal', secondary: 'Secundario' };

const labelForRole = (role) => ROLE_LABELS[role] || role;

/**
 * Tablero de Progreso Mensual BLACK GYM:
 * tabla P (peso) / R (reps) por ejercicio x 8 sesiones con fases + guía.
 */
const MonthlyBoardTable = ({ board }) => {
  if (!board) return null;

  const sessions = [...(board.sessions || [])].sort(
    (a, b) => a.session_number - b.session_number
  );
  const entries = [...(board.entries || [])].sort((a, b) => a.order - b.order);

  const cellFor = (entry, sessionNumber) =>
    (entry.session_data || []).find((d) => d.session_number === sessionNumber) || null;

  const fmtDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Encabezado del tablero */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-slate-400">Afiliado: </span>
          <span className="text-white font-semibold">
            {board.client_name || board.client_email}
          </span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-slate-400">Mes: </span>
          <span className="text-white font-semibold">
            {board.month ? String(board.month).slice(0, 7) : '—'}
          </span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-slate-400">Meta: </span>
          <span className="text-white font-semibold">
            {GOAL_LABELS[board.goal] || board.goal}
          </span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-slate-400">Bloque: </span>
          <span className="text-white font-semibold">{board.training_block}</span>
        </div>
      </div>

      <table className="w-full text-xs border-collapse min-w-[720px]">
        <thead>
          <tr>
            <th className="text-left text-slate-300 font-semibold p-2 sticky left-0 bg-slate-900/80">
              Ejercicio
            </th>
            <th className="text-left text-slate-300 font-semibold p-2">Tipo</th>
            <th className="text-left text-slate-300 font-semibold p-2">Control</th>
            {sessions.map((s) => {
              const st = PHASE_STYLES[s.phase] || PHASE_STYLES.impacto;
              return (
                <th key={s.id} className={`p-1 ${st.bg} ${st.border} border`}>
                  <div className={`font-bold ${st.text}`}>S{s.session_number}</div>
                  <div className="text-[9px] uppercase text-slate-400">
                    {s.phase}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-white/5">
              <td className="p-2 text-white font-medium sticky left-0 bg-slate-900/80">
                {entry.order}. {entry.exercise_name}
              </td>
              <td className="p-2 text-slate-400">{labelForRole(entry.role)}</td>
              <td className="p-2 text-slate-500">P / R</td>
              {sessions.map((s) => {
                const cell = cellFor(entry, s.session_number);
                return (
                  <td key={s.id} className="p-1 text-center border border-white/5">
                    {cell && (cell.weight_kg != null || cell.reps_done != null) ? (
                      <span className="inline-flex flex-col leading-tight">
                        <span className="text-emerald-300 font-bold">
                          {cell.weight_kg != null ? `${cell.weight_kg}kg` : '—'}
                        </span>
                        <span className="text-slate-400">
                          {cell.reps_done != null ? `${cell.reps_done} reps` : ''}
                          {cell.reached_failure ? ' 🔥' : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-700">·</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={3 + sessions.length} className="p-4 text-center text-slate-500">
                Aún no hay ejercicios en el tablero.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Fechas de sesión */}
      {sessions.some((s) => s.date) && (
        <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-slate-400">
          {sessions.map((s) => (
            <span key={`d-${s.id}`}>
              S{s.session_number}: {fmtDate(s.date) || '—'}
            </span>
          ))}
        </div>
      )}

      {/* Guía metodológica */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-[11px]">
        <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-emerald-300 font-bold mb-1">Impacto (S1-4)</p>
          <p className="text-slate-300">
            Trabaja ~15 reps. Si completas el rango con buena técnica, sube el peso.
          </p>
        </div>
        <div className="rounded-xl p-3 bg-sky-500/10 border border-sky-500/30">
          <p className="text-sky-300 font-bold mb-1">Descarga (S5-6)</p>
          <p className="text-slate-300">
            Entrena lejos del fallo. Mantén las cargas estables para recuperar.
          </p>
        </div>
        <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30">
          <p className="text-amber-300 font-bold mb-1">Potencia (S7-8)</p>
          <p className="text-slate-300">
            Peso máximo, máximo 6 reps. Prioriza la intención explosiva.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBoardTable;
