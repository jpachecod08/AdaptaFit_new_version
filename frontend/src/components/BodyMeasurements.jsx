import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Ruler, Plus, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { API_URL } from '../config';

const FIELDS = [
  { key: 'weight_kg', label: 'Peso (kg)', step: '0.1' },
  { key: 'body_fat_percentage', label: '% Grasa', step: '0.1' },
  { key: 'muscle_mass_kg', label: 'Masa muscular (kg)', step: '0.1' },
  { key: 'chest_cm', label: 'Pecho (cm)', step: '0.1' },
  { key: 'waist_cm', label: 'Cintura (cm)', step: '0.1' },
  { key: 'hip_cm', label: 'Cadera (cm)', step: '0.1' },
  { key: 'arm_cm', label: 'Brazo (cm)', step: '0.1' },
  { key: 'thigh_cm', label: 'Muslo (cm)', step: '0.1' },
];

const BodyMeasurements = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recorded_at: new Date().toISOString().slice(0, 10) });

  const headers = { Authorization: `Token ${token}` };

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/workouts/my-body-measurements/`, { headers });
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/workouts/my-body-measurements/`, form, { headers });
      setForm({ recorded_at: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      await fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar la medición.');
    } finally {
      setSaving(false);
    }
  };

  const latest = items[0];
  const first = items[items.length - 1];
  const weightDelta =
    latest && first && latest.weight_kg != null && first.weight_kg != null
      ? (Number(latest.weight_kg) - Number(first.weight_kg)).toFixed(1)
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400">
            <Ruler size={20} className="text-slate-900" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Medidas e indicadores</h2>
            <p className="text-slate-400 text-xs">
              {items.length} registro{items.length === 1 ? '' : 's'}
              {weightDelta !== null && (
                <>
                  {' · '}
                  <span className={Number(weightDelta) <= 0 ? 'text-emerald-400' : 'text-orange-400'}>
                    {Number(weightDelta) > 0 ? '+' : ''}{weightDelta} kg desde el inicio
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Nueva medición
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="text-xs text-slate-400 col-span-2 md:col-span-1">
              Fecha
              <input
                type="date"
                value={form.recorded_at || ''}
                onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm"
              />
            </label>
            {FIELDS.map((f) => (
              <label key={f.key} className="text-xs text-slate-400">
                {f.label}
                <input
                  type="number"
                  step={f.step}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm"
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-bold text-sm disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />} Guardar
          </button>
        </form>
      )}

      {loading ? (
        <Loader2 className="animate-spin text-lime-400" size={20} />
      ) : items.length === 0 ? (
        <p className="text-slate-500 text-sm">Aún no registras medidas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left p-2">Fecha</th>
                {FIELDS.map((f) => (
                  <th key={f.key} className="text-right p-2">{f.label.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-white/5 text-slate-200">
                  <td className="p-2">{m.recorded_at}</td>
                  {FIELDS.map((f) => (
                    <td key={f.key} className="text-right p-2">
                      {m[f.key] != null ? m[f.key] : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {items.length >= 2 && latest?.weight_kg != null && (
            <p className="text-slate-500 text-[11px] mt-2 flex items-center gap-1">
              {Number(weightDelta) <= 0 ? (
                <><TrendingDown size={12} className="text-emerald-400" /> Tendencia favorable de peso.</>
              ) : (
                <><TrendingUp size={12} className="text-orange-400" /> Peso en aumento.</>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BodyMeasurements;
