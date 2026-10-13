import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Check, X, ChevronRight } from 'lucide-react';
import { API_URL } from '../config';

const TYPE_STYLES = {
  routine_assigned: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  trainer_change: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  recommendation: 'bg-lime-500/10 border-lime-500/30 text-lime-300',
  workout_reminder: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  board: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
  general: 'bg-white/5 border-white/10 text-slate-300',
};

const TYPE_LABELS = {
  routine_assigned: 'Rutina',
  trainer_change: 'Cambio',
  recommendation: 'Recomendación',
  workout_reminder: 'Recordatorio',
  board: 'Progreso',
  general: 'Aviso',
};

const ACTION_LABELS = {
  routine_assigned: 'Ver rutina',
  trainer_change: 'Ver cambio',
  recommendation: 'Ver recomendación',
  workout_reminder: 'Ir a entrenar',
  board: 'Ver progreso',
};

const NotificationsBell = ({ token }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  const headers = { Authorization: `Token ${token}` };

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/workouts/notifications/`, { headers });
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {
      /* silencioso */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (id) => {
    try {
      await axios.post(`${API_URL}/api/workouts/notifications/${id}/read/`, {}, { headers });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* silencioso */
    }
  };

  const handleOpenNotification = (n) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await axios.post(`${API_URL}/api/workouts/notifications/read-all/`, {}, { headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className="relative w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
        title="Notificaciones"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Notificaciones</span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-emerald-400 text-xs font-semibold hover:text-emerald-300 flex items-center gap-1"
              >
                <Check size={13} /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">
                No tienes notificaciones.
              </p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleOpenNotification(n)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  n.is_read ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${TYPE_STYLES[n.type] || TYPE_STYLES.general}`}>
                    {TYPE_LABELS[n.type] || n.type}
                  </span>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-red-500" title="No leída" />
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); markRead(n.id); } }}
                    className="ml-auto text-slate-500 hover:text-emerald-400 cursor-pointer"
                    title="Marcar como leída"
                  >
                    <X size={13} />
                  </span>
                </div>
                <p className="text-white text-sm font-semibold mt-1">{n.title}</p>
                {n.message && (
                  <p className="text-slate-400 text-xs mt-0.5">{n.message}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-600 text-[10px]">
                    {n.created_at ? new Date(n.created_at).toLocaleString('es-ES') : ''}
                  </span>
                  {n.link && (
                    <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-0.5">
                      {ACTION_LABELS[n.type] || 'Ver'} <ChevronRight size={12} />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
