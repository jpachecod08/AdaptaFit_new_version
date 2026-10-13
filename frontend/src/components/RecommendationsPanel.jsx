import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageSquare, Check } from 'lucide-react';
import { API_URL } from '../config';

const RecommendationsPanel = ({ token }) => {
  const [items, setItems] = useState([]);
  const headers = { Authorization: `Token ${token}` };

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/workouts/my-recommendations/`, { headers });
      setItems(data || []);
    } catch {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const markRead = async (id) => {
    try {
      await axios.post(`${API_URL}/api/workouts/recommendations/${id}/read/`, {}, { headers });
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
    } catch {
      /* silencioso */
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-400">
          <MessageSquare size={20} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">Recomendaciones de tu entrenador</h2>
          <p className="text-slate-400 text-xs">
            {items.filter((r) => !r.is_read).length} sin leer
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((r) => (
          <div
            key={r.id}
            className={`p-4 rounded-2xl border ${
              r.is_read
                ? 'bg-white/5 border-white/10'
                : 'bg-lime-500/10 border-lime-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-emerald-300 text-xs font-semibold">
                {r.trainer_name || r.trainer_email}
              </span>
              <span className="text-slate-500 text-[10px]">
                {r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES') : ''}
              </span>
            </div>
            <p className="text-slate-200 text-sm whitespace-pre-wrap">{r.message}</p>
            {!r.is_read && (
              <button
                onClick={() => markRead(r.id)}
                className="mt-2 text-[11px] text-lime-300 hover:text-lime-200 flex items-center gap-1 font-semibold"
              >
                <Check size={12} /> Marcar como leída
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
