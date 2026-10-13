import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { GitBranch, Check } from 'lucide-react';
import { API_URL } from '../config';

const CHANGE_LABELS = {
  exercise_swap: 'Cambio de ejercicio',
  weight_update: 'Actualización de peso',
  sets_reps_update: 'Cambio de series/reps',
  session_reorder: 'Reordenamiento de sesiones',
  routine_change: 'Cambio de rutina',
};

const StructureChangesPanel = ({ token, clientId }) => {
  const [items, setItems] = useState([]);
  const headers = { Authorization: `Token ${token}` };

  const fetchItems = useCallback(async () => {
    if (!clientId) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/api/workouts/clients/${clientId}/structure-changes/`,
        { headers }
      );
      setItems(data || []);
    } catch {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const acknowledge = async (id) => {
    try {
      await axios.post(
        `${API_URL}/api/workouts/structure-changes/${id}/acknowledge/`,
        {},
        { headers }
      );
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, client_acknowledged: true } : c))
      );
    } catch {
      /* silencioso */
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400">
          <GitBranch size={20} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">Cambios en tu estructura</h2>
          <p className="text-slate-400 text-xs">
            {items.filter((c) => !c.client_acknowledged).length} por comprender
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((c) => (
          <div
            key={c.id}
            className={`p-4 rounded-2xl border ${
              c.client_acknowledged
                ? 'bg-white/5 border-white/10'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-amber-300 text-xs font-semibold uppercase">
                {CHANGE_LABELS[c.change_type] || c.change_type}
              </span>
              <span className="text-slate-500 text-[10px]">
                {c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : ''}
              </span>
            </div>
            <p className="text-slate-200 text-sm mt-1 whitespace-pre-wrap">{c.reason}</p>
            {!c.client_acknowledged ? (
              <button
                onClick={() => acknowledge(c.id)}
                className="mt-2 text-[11px] text-amber-200 hover:text-amber-100 flex items-center gap-1 font-semibold"
              >
                <Check size={12} /> Entendido
              </button>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <Check size={12} /> Comprendido
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StructureChangesPanel;
