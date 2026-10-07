import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Users, UserPlus, UserCog, ShieldCheck, ShieldOff, Activity,
  Loader2, Search, Trash2, Power, RotateCcw, X, CheckCircle2,
  AlertTriangle, Ban, IdCard, Clock, Mail,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const ROLES = {
  admin: { label: 'Administrador', chip: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  entrenador: { label: 'Entrenador', chip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  usuario: { label: 'Usuario', chip: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
};

const ACCIONES = {
  create_trainer: 'creó el entrenador',
  create_user: 'creó la cuenta',
  activate: 'activó la cuenta',
  deactivate: 'desactivó la cuenta',
  set_role: 'cambió el rol de',
  reset_password: 'restableció la contraseña de',
  delete_user: 'eliminó la cuenta',
  grant_admin: 'otorgó permisos de administrador a',
  revoke_admin: 'quitó permisos de administrador a',
};

const AdminPanelPage = ({ token, onLogout }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('entrenadores');
  const [search, setSearch] = useState('');
  const [selfId, setSelfId] = useState(null);
  const [busy, setBusy] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [confirm, setConfirm] = useState(null);   // { tipo, user }
  const [resetPw, setResetPw] = useState(null);   // { user, password }
  const [toast, setToast] = useState(null);       // { tipo, texto }

  const headers = { Authorization: `Token ${token}` };

  const flash = (tipo, texto) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [perfil, listado] = await Promise.all([
        axios.get(`${API_URL}/api/users/profile/`, { headers }),
        axios.get(`${API_URL}/api/users/admin/users/`, { headers }),
      ]);
      setSelfId(perfil.data.id);
      setStats(listado.data.stats);
      setUsers(listado.data.users);

      if (tab === 'actividad') {
        const act = await axios.get(`${API_URL}/api/users/admin/activity/`, { headers });
        setActivity(act.data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('No tienes permisos de administrador.');
      } else {
        setError('No se pudieron cargar los datos.');
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadActivity = async () => {
    try {
      const act = await axios.get(`${API_URL}/api/users/admin/activity/`, { headers });
      setActivity(act.data);
    } catch { /* el historial es best-effort */ }
  };

  // ------------------------------------------------------------- ACCIONES
  const aplicar = async (fn, exitoTexto) => {
    try {
      setBusy(true);
      const r = await fn();
      if (r?.data?.warnings?.length) flash('aviso', r.data.warnings.join(' '));
      flash('ok', r?.data?.message || exitoTexto);
      await loadData();
      if (tab === 'actividad') loadActivity();
    } catch (err) {
      flash('error', err.response?.data?.error || 'No se pudo completar la acción.');
    } finally {
      setBusy(false);
      setConfirm(null);
      setResetPw(null);
      setShowCreate(false);
    }
  };

  const toggleActivo = (u) => aplicar(
    () => axios.patch(`${API_URL}/api/users/admin/users/${u.id}/`,
      { is_active: !u.is_active }, { headers }),
    'Estado actualizado.',
  );

  const cambiarRol = (u, role) => aplicar(
    () => axios.patch(`${API_URL}/api/users/admin/users/${u.id}/`, { role }, { headers }),
    'Rol actualizado.',
  );

  const otorgarPermiso = (u) => aplicar(
    () => axios.patch(`${API_URL}/api/users/admin/users/${u.id}/`, { es_admin: true }, { headers }),
    'Permisos de administrador otorgados.',
  );

  const quitarPermiso = (u) => aplicar(
    () => axios.patch(`${API_URL}/api/users/admin/users/${u.id}/`, { es_admin: false }, { headers }),
    'Permisos de administrador retirados.',
  );

  const eliminar = (u) => aplicar(
    () => axios.delete(`${API_URL}/api/users/admin/users/${u.id}/delete/`, { headers }),
    'Cuenta eliminada.',
  );

  const guardarPassword = () => aplicar(
    () => axios.patch(`${API_URL}/api/users/admin/users/${resetPw.user.id}/`,
      { password: resetPw.password }, { headers }),
    'Contraseña restablecida.',
  );

  // ------------------------------------------------------------- FILTROS
  const filtrados = users.filter((u) => {
    const coincideRol = tab === 'actividad'
      || (tab === 'todos' || (tab === 'entrenadores' && u.role === 'entrenador')
        || (tab === 'usuarios' && u.role === 'usuario')
        || (tab === 'admins' && u.es_admin));
    const q = search.trim().toLowerCase();
    const coincideTexto = !q || u.email.toLowerCase().includes(q)
      || (u.nombre || '').toLowerCase().includes(q);
    return coincideRol && coincideTexto;
  });

  // ============================================================ LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-lime-400 mx-auto mb-4" size={48} />
          <p className="text-slate-300 text-lg font-medium">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
        <div className="bg-red-500/10 border-2 border-red-500/30 backdrop-blur-md rounded-3xl p-8 max-w-md w-full text-center">
          <Ban className="text-red-400 mx-auto mb-4" size={44} />
          <p className="text-red-300 font-semibold mb-4">{error}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold flex-1">
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'entrenadores', label: 'Entrenadores', icon: IdCard },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'admins', label: 'Administradores', icon: ShieldCheck },
    { id: 'todos', label: 'Todos', icon: Users },
    { id: 'actividad', label: 'Actividad', icon: Activity },
  ];

  // ============================================================ RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
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
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-900 font-extrabold text-xl shadow-lg shadow-amber-500/30">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h1 className="text-white text-2xl font-extrabold">Panel de Administración</h1>
                <p className="text-slate-400 text-sm">
                  Gestión de usuarios, entrenadores y permisos
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
                title="Volver al dashboard"
              >
                <Users size={20} />
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

        {/* ==================== ESTADÍSTICAS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Entrenadores', valor: stats?.entrenadores, color: 'from-emerald-500 to-teal-500', icon: IdCard },
            { label: 'Usuarios', valor: stats?.usuarios, color: 'from-sky-500 to-blue-500', icon: Users },
            { label: 'Desactivados', valor: stats?.inactivos, color: 'from-rose-500 to-red-500', icon: Ban },
            { label: 'Sin entrenador', valor: stats?.sin_entrenador, color: 'from-amber-500 to-orange-500', icon: UserCog },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
                <c.icon size={18} className="text-white" />
              </div>
              <p className="text-white text-2xl font-extrabold">{c.valor ?? '—'}</p>
              <p className="text-slate-400 text-xs uppercase tracking-wider">{c.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ==================== BARRA DE HERRAMIENTAS ==================== */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus size={18} />
              Nuevo entrenador
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); if (t.id === 'actividad') loadActivity(); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border ${
                  tab === t.id
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== CONTENIDO ==================== */}
        {tab === 'actividad' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
          >
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Clock size={18} /> Historial de acciones
            </h2>
            {activity.length === 0 ? (
              <p className="text-slate-400 text-sm">Todavía no hay acciones registradas.</p>
            ) : (
              <div className="space-y-2">
                {activity.map((a) => (
                  <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-slate-500 text-xs w-28 shrink-0">{a.fecha}</span>
                    <span className="text-emerald-300 font-semibold">{a.actor}</span>
                    <span className="text-slate-300">{ACCIONES[a.action] || a.action}</span>
                    <span className="text-slate-400">{a.target}</span>
                    {a.detail && <span className="text-slate-500 w-full sm:w-auto">{a.detail}</span>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center">
            <Users className="text-slate-500 mx-auto mb-3" size={44} />
            <p className="text-slate-300 font-semibold">No hay usuarios que coincidan</p>
            <p className="text-slate-500 text-sm">Prueba con otra búsqueda o pestaña.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtrados.map((u, i) => {
              const rol = ROLES[u.role] || ROLES.usuario;
              const esYo = u.id === selfId;
              const bloqueado = u.es_ultimo_admin;
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-5 ${
                    u.is_active ? 'border-white/10' : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      u.es_admin ? 'bg-amber-500/20 text-amber-300'
                        : u.role === 'entrenador' ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      {(u.nombre || u.email).charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold">{u.nombre || '—'}</span>
                        {u.es_admin && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full border font-semibold bg-amber-500/20 text-amber-300 border-amber-500/40">
                            Administrador
                          </span>
                        )}
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${rol.chip}`}>
                          {rol.label}
                        </span>
                        {!u.is_active && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-rose-500/40 bg-rose-500/20 text-rose-300 font-semibold">
                            Desactivado
                          </span>
                        )}
                        {esYo && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/20 bg-white/10 text-slate-300 font-semibold">
                            Tu cuenta
                          </span>
                        )}
                      </div>

                      <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
                        <Mail size={13} /> {u.email}
                      </p>

                      <div className="text-slate-500 text-xs mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {u.role === 'entrenador' && (
                          <span>
                            {u.especialidad || 'Sin especialidad'} ·{' '}
                            <span className="text-emerald-400">{u.clientes_activos}</span> clientes activos
                            {u.clientes_total > u.clientes_activos && ` (${u.clientes_total} en total)`}
                          </span>
                        )}
                        {u.role === 'usuario' && (
                          <span>
                            {u.entrenador ? `Entrenador: ${u.entrenador}` : 'Sin entrenador asignado'}
                            {' · '}
                            <span className="text-emerald-400">{u.sesiones_completadas}</span> sesiones completadas
                          </span>
                        )}
                        <span>Alta: {u.date_joined}</span>
                        {u.ultimo_acceso && <span>Último acceso: {u.ultimo_acceso}</span>}
                      </div>
                    </div>

                    {/* ------- ACCIONES ------- */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleActivo(u)}
                        disabled={busy || bloqueado || (esYo && u.is_active)}
                        title={bloqueado ? 'No puedes desactivar al último administrador'
                          : (esYo && u.is_active) ? 'No puedes desactivarte a ti mismo'
                            : u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 border-white/10 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300"
                      >
                        <Power size={14} />
                        {u.is_active ? 'Desactivar' : 'Activar'}
                      </button>

                      {!u.es_admin ? (
                        <button
                          onClick={() => otorgarPermiso(u)}
                          disabled={busy || !u.is_active}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-30"
                          title={u.is_active ? 'Dar permisos de administrador'
                            : 'Primero activa la cuenta'}
                        >
                          <ShieldCheck size={14} /> Dar permisos
                        </button>
                      ) : !esYo && (
                        <button
                          onClick={() => quitarPermiso(u)}
                          disabled={busy || bloqueado}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-30"
                          title={bloqueado ? 'No puedes dejar al sistema sin administradores'
                            : 'Quitar permisos de administrador'}
                        >
                          <ShieldOff size={14} /> Quitar permisos
                        </button>
                      )}

                      {u.role === 'entrenador' && (
                        <button
                          onClick={() => cambiarRol(u, 'usuario')}
                          disabled={busy || bloqueado}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border bg-white/5 border-white/10 text-slate-300 hover:border-sky-500/50 hover:text-sky-300 transition-all flex items-center gap-1.5 disabled:opacity-30"
                          title="Quitarle el rol de entrenador"
                        >
                          <UserCog size={14} /> Quitar entrenador
                        </button>
                      )}

                      {u.role === 'usuario' && (
                        <button
                          onClick={() => cambiarRol(u, 'entrenador')}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-30"
                          title="Convertir en entrenador"
                        >
                          <IdCard size={14} /> Hacer entrenador
                        </button>
                      )}

                      <button
                        onClick={() => setResetPw({ user: u, password: '' })}
                        disabled={busy}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border bg-white/5 border-white/10 text-slate-300 hover:border-lime-500/50 hover:text-lime-300 transition-all flex items-center gap-1.5 disabled:opacity-30"
                        title="Restablecer contraseña"
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button
                        onClick={() => setConfirm({ tipo: 'eliminar', user: u })}
                        disabled={busy || bloqueado || esYo}
                        title={esYo ? 'No puedes eliminar tu cuenta'
                          : bloqueado ? 'No puedes eliminar al último administrador'
                            : 'Eliminar definitivamente'}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border bg-white/5 border-white/10 text-slate-300 hover:border-rose-500/50 hover:text-rose-300 transition-all flex items-center gap-1.5 disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== MODAL: CREAR ENTRENADOR ==================== */}
      <AnimatePresence>
        {showCreate && (
          <Modal titulo="Nuevo entrenador" onClose={() => !busy && setShowCreate(false)}>
            <FormCrearEntrenador onCancelar={() => !busy && setShowCreate(false)}
              onAceptar={(datos) => aplicar(
                () => axios.post(`${API_URL}/api/users/admin/users/create/`, datos, { headers }),
                'Entrenador creado.')} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: CONFIRMAR ==================== */}
      <AnimatePresence>
        {confirm && (
          <Modal titulo="Confirmar eliminación" onClose={() => !busy && setConfirm(null)}>
            <p className="text-slate-300 text-sm mb-2">
              Vas a eliminar <strong className="text-white">{confirm.user.email}</strong> de forma
              <strong className="text-rose-300"> permanente</strong>.
            </p>
            <p className="text-slate-500 text-xs mb-5">
              Se borrará su historial de entrenamiento y series. Si solo quieres
              impedir el acceso, usa <em>Desactivar</em> en su lugar.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} disabled={busy}
                className="flex-1 bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
                Cancelar
              </button>
              <button onClick={() => eliminar(confirm.user)} disabled={busy}
                className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Eliminar
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: NUEVA CONTRASEÑA ==================== */}
      <AnimatePresence>
        {resetPw && (
          <Modal titulo="Restablecer contraseña" onClose={() => !busy && setResetPw(null)}>
            <p className="text-slate-400 text-sm mb-4">
              Nueva contraseña para <strong className="text-white">{resetPw.user.email}</strong>.
              Al guardarla se cerrarán sus sesiones abiertas.
            </p>
            <input
              type="text"
              value={resetPw.password}
              onChange={(e) => setResetPw({ ...resetPw, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-lime-500/60 text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setResetPw(null)} disabled={busy}
                className="flex-1 bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
                Cancelar
              </button>
              <button onClick={guardarPassword} disabled={busy || resetPw.password.length < 8}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-lime-600 text-white px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                Guardar
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ==================== TOAST ==================== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 ${
              toast.tipo === 'error' ? 'bg-rose-500/15 border-rose-500/40'
                : toast.tipo === 'aviso' ? 'bg-amber-500/15 border-amber-500/40'
                  : 'bg-emerald-500/15 border-emerald-500/40'
            }`}
          >
            {toast.tipo === 'error'
              ? <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
              : toast.tipo === 'aviso'
                ? <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                : <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />}
            <p className="text-white text-sm">{toast.texto}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MODAL GENÉRICO
// ---------------------------------------------------------------------------
const Modal = ({ titulo, children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 15 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-800 border border-white/10 rounded-3xl p-6 w-full max-w-md"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold text-lg">{titulo}</h3>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <X size={18} />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// FORMULARIO DE ALTA DE ENTRENADOR
// ---------------------------------------------------------------------------
const FormCrearEntrenador = ({ onCancelar, onAceptar }) => {
  const [f, setF] = useState({
    nombre: '', email: '', password: '', especialidad: '',
    anos_experiencia: '', telefono: '', biografia: '',
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const valido = f.email.trim() && f.password.length >= 8 && f.nombre.trim();

  return (
    <div className="space-y-3">
      <input value={f.nombre} onChange={(e) => set('nombre', e.target.value)}
        placeholder="Nombre completo *"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm" />

      <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)}
        placeholder="Correo electrónico *"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm" />

      <input type="password" value={f.password} onChange={(e) => set('password', e.target.value)}
        placeholder="Contraseña (mínimo 8 caracteres) *"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm" />

      <div className="grid grid-cols-2 gap-3">
        <input value={f.especialidad} onChange={(e) => set('especialidad', e.target.value)}
          placeholder="Especialidad"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm" />
        <input type="number" value={f.anos_experiencia}
          onChange={(e) => set('anos_experiencia', e.target.value)}
          placeholder="Años de experiencia"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm" />
      </div>

      <input value={f.telefono} onChange={(e) => set('telefono', e.target.value)}
        placeholder="Teléfono"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm" />

      <textarea rows={2} value={f.biografia} onChange={(e) => set('biografia', e.target.value)}
        placeholder="Biografía (opcional)"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm resize-none" />

      <div className="flex gap-3 pt-2">
        <button onClick={onCancelar}
          className="flex-1 bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
          Cancelar
        </button>
        <button onClick={() => onAceptar(f)} disabled={!valido}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-lime-600 text-white px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]">
          <UserPlus size={16} /> Crear entrenador
        </button>
      </div>
    </div>
  );
};

export default AdminPanelPage;
