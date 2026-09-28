import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Dumbbell, TrendingUp, LogOut, Edit, Eye, Video,
  UserPlus, PlusCircle, Search, AlertTriangle, CheckCircle,
  Mail, Calendar, Settings, X, Flame, Award, Clock,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const TrainerDashboardPage = ({ onLogout }) => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTable, setActiveTable] = useState('all'); // 'all' | 'clients'

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoLink, setVideoLink] = useState('');

  // Progreso del cliente
  const [clientProgress, setClientProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? `Token ${token}` : null;
  };

  useEffect(() => {
    const verifyAndFetch = async () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        setTimeout(() => navigate('/login'), 2000);
        setLoading(false);
        return;
      }
      if (userRole !== 'entrenador') {
        setError('Solo los entrenadores pueden acceder.');
        setTimeout(() => navigate('/dashboard'), 2000);
        setLoading(false);
        return;
      }

      await Promise.all([fetchClients(), fetchAllUsers()]);
    };
    verifyAndFetch();
  }, [navigate]);

  const fetchClients = async () => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/api/users/trainer/clients/`, {
        headers: { Authorization: authHeader },
      });
      setClients(response.data);
    } catch (err) {
      console.error('Error clients:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/api/users/trainer/all-users/`, {
        headers: { Authorization: authHeader },
      });
      setAllUsers(response.data);
    } catch (err) {
      console.error('Error all users:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewClientDetails = async (clientId) => {
    try {
      const authHeader = getAuthHeader();
      const infoResp = await axios.get(
        `${API_URL}/api/users/trainer/clients/${clientId}/`,
        { headers: { Authorization: authHeader } }
      );
      setSelectedClient(infoResp.data);
      setViewDialogOpen(true);

      setProgressLoading(true);
      try {
        const progResp = await axios.get(
          `${API_URL}/api/workouts/clients/${clientId}/progress/`,
          { headers: { Authorization: authHeader } }
        );
        setClientProgress(progResp.data);
      } catch {
        setClientProgress(null);
      } finally {
        setProgressLoading(false);
      }
    } catch (err) {
      setError('Error al cargar detalles: ' + err.message);
    }
  };

  const startVideoCall = (clientId) => {
    const roomId = `adaptafit-${clientId}-${Date.now()}`;
    setVideoLink(`https://meet.jit.si/${roomId}`);
    setVideoDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin actividad';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const goToRoutineBuilder = (clientId = null) => {
    if (clientId) {
      navigate(`/routine-builder?client_id=${clientId}`);
    } else {
      navigate('/routine-builder');
    }
  };

  // Filtrado
  const filteredUsers = allUsers.filter(u =>
    !searchTerm ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">

      {/* Blobs decorativos */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* ============ NAVBAR ============ */}
      <nav className="relative z-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-400 to-lime-400 p-2 rounded-xl shadow-lg shadow-emerald-500/30">
              <Dumbbell size={22} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight">AdaptaFit</h1>
              <p className="text-emerald-300 text-xs font-medium uppercase tracking-widest">Panel Entrenador</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/editar-perfil')}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
              title="Configuración"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => { onLogout(); navigate('/login'); }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-red-400"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* ============ MAIN ============ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">

        {/* Mensajes */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-300 rounded-xl flex items-start gap-3">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-300 rounded-xl flex items-start gap-3">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{success}</span>
          </motion.div>
        )}

        {/* ============ STATS CARDS ============ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users size={22} />}
            color="emerald"
            value={allUsers.length}
            label="Usuarios registrados"
          />
          <StatCard
            icon={<Dumbbell size={22} />}
            color="lime"
            value={clients.length}
            label="Clientes activos"
          />
          <StatCard
            icon={<Flame size={22} />}
            color="orange"
            value={clients.filter(c => c.completed_today > 0).length}
            label="Activos hoy"
          />
          <StatCard
            icon={<AlertTriangle size={22} />}
            color="amber"
            value={clients.filter(c => c.needs_attention).length}
            label="Necesitan atención"
          />
        </div>

        {/* ============ CONTENEDOR PRINCIPAL ============ */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">

          {/* Header del panel */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <div>
                <h2 className="text-white text-2xl font-extrabold mb-1">
                  Gestión de Clientes
                </h2>
                <p className="text-slate-400 text-sm">
                  Asigna rutinas y haz seguimiento a todos los usuarios del gimnasio
                </p>
              </div>
              <button
                onClick={() => goToRoutineBuilder()}
                className="group bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle size={20} />
                Crear Nueva Rutina
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
              <TabButton
                active={activeTable === 'all'}
                onClick={() => setActiveTable('all')}
                label={`Todos los Usuarios`}
                count={allUsers.length}
              />
              <TabButton
                active={activeTable === 'clients'}
                onClick={() => setActiveTable('clients')}
                label={`Mis Clientes`}
                count={clients.length}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b border-white/5">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {activeTable === 'all' ? (
              <UsersTable
                users={filteredUsers}
                onAssign={goToRoutineBuilder}
                onView={viewClientDetails}
                onVideo={startVideoCall}
              />
            ) : (
              <ClientsTable
                clients={clients}
                onAssign={goToRoutineBuilder}
                onView={viewClientDetails}
                onVideo={startVideoCall}
              />
            )}
          </div>
        </div>
      </div>

      {/* ============ MODAL: DETALLES DEL CLIENTE ============ */}
      {viewDialogOpen && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          progress={clientProgress}
          progressLoading={progressLoading}
          onClose={() => setViewDialogOpen(false)}
          onAssign={() => { setViewDialogOpen(false); goToRoutineBuilder(selectedClient.client?.id); }}
          onVideo={() => { setViewDialogOpen(false); startVideoCall(selectedClient.client?.id); }}
        />
      )}

      {/* ============ MODAL: VIDEOLLAMADA ============ */}
      {videoDialogOpen && (
        <VideoCallModal
          link={videoLink}
          onClose={() => setVideoDialogOpen(false)}
        />
      )}
    </div>
  );
};

// ==================== SUB-COMPONENTES ====================

const StatCard = ({ icon, color, value, label }) => {
  const colorMap = {
    emerald: 'from-emerald-400 to-emerald-500 shadow-emerald-500/30',
    lime: 'from-lime-400 to-lime-500 shadow-lime-500/30',
    orange: 'from-orange-400 to-orange-500 shadow-orange-500/30',
    amber: 'from-amber-400 to-amber-500 shadow-amber-500/30',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 hover:border-emerald-500/30 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-slate-900 shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-white text-3xl font-extrabold leading-none">{value}</p>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mt-1">{label}</p>
        </div>
      </div>
    </motion.div>
  );
};

const TabButton = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
      active
        ? 'text-lime-400 border-lime-400'
        : 'text-slate-400 border-transparent hover:text-slate-200'
    }`}
  >
    {label}
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
      active ? 'bg-lime-400/20 text-lime-400' : 'bg-white/10 text-slate-400'
    }`}>
      {count}
    </span>
  </button>
);

const UsersTable = ({ users, onAssign, onView, onVideo }) => {
  if (users.length === 0) {
    return (
      <div className="py-16 text-center">
        <Users size={60} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Usuario</th>
          <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Registro</th>
          <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Estado</th>
          <th className="text-right text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
            <td className="py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center text-slate-900 font-extrabold">
                  {u.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white font-semibold">{u.name}</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1">
                    <Mail size={12} />
                    {u.email}
                  </p>
                </div>
              </div>
            </td>
            <td className="py-4 px-6">
              <p className="text-slate-300 text-sm flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                {new Date(u.date_joined).toLocaleDateString('es-ES')}
              </p>
            </td>
            <td className="py-4 px-6">
              {u.is_mine ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <CheckCircle size={12} /> Mi cliente
                </span>
              ) : u.has_trainer ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  Otro entrenador
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-500/20 text-slate-300 text-xs font-semibold border border-slate-500/30">
                  Sin asignar
                </span>
              )}
            </td>
            <td className="py-4 px-6">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onAssign(u.id)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Asignar rutina"
                >
                  <PlusCircle size={14} />
                  Rutina
                </button>
                <button
                  onClick={() => onView(u.id)}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
                  title="Ver detalles"
                >
                  <Eye size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ClientsTable = ({ clients, onAssign, onView, onVideo }) => {
  if (clients.length === 0) {
    return (
      <div className="py-16 text-center">
        <Dumbbell size={60} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Aún no tienes clientes activos</p>
        <p className="text-slate-500 text-sm mt-1">
          Ve a "Todos los Usuarios" para asignar una rutina a alguien
        </p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Cliente</th>
          <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Plan</th>
          <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Progreso hoy</th>
          <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Racha</th>
          <th className="text-right text-xs uppercase tracking-wider text-slate-400 font-bold py-4 px-6">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((c) => (
          <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
            <td className="py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center text-slate-900 font-extrabold">
                  {c.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="text-white font-semibold">{c.name}</p>
                  <p className="text-slate-400 text-xs">{c.email}</p>
                </div>
              </div>
            </td>
            <td className="py-4 px-6">
              <p className="text-slate-300 text-sm">{c.plan_name || 'Sin plan'}</p>
            </td>
            <td className="py-4 px-6">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-lime-400"
                    style={{ width: `${((c.completed_today || 0) / (c.total_exercises || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-lime-400 text-sm font-bold">
                  {c.completed_today || 0}/{c.total_exercises || 0}
                </span>
              </div>
            </td>
            <td className="py-4 px-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Flame size={12} />
                {c.current_streak || 0} días
              </span>
            </td>
            <td className="py-4 px-6">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onView(c.id)}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
                  title="Ver detalles"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onVideo(c.id)}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
                  title="Videollamada"
                >
                  <Video size={16} />
                </button>
                <button
                  onClick={() => onAssign(c.id)}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center justify-center text-slate-300 hover:text-emerald-400"
                  title="Asignar rutina"
                >
                  <PlusCircle size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ClientDetailsModal = ({ client, progress, progressLoading, onClose, onAssign, onVideo }) => {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-lime-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/30 backdrop-blur-sm flex items-center justify-center text-white font-extrabold text-xl">
              {client.client?.nombre?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <p className="text-white font-extrabold text-lg">{client.client?.nombre || client.client?.email}</p>
              <p className="text-white/80 text-sm">{client.client?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'info', label: 'Información' },
            { id: 'progress', label: 'Progreso de Rutina' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-6 py-4 font-semibold text-sm transition-all border-b-2 ${
                activeTab === t.id
                  ? 'text-lime-400 border-lime-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <InfoRow label="Email" value={client.client?.email} />
              {client.client?.profile?.objetivo && (
                <InfoRow label="Objetivo" value={client.client.profile.objetivo} />
              )}
              {client.client?.profile?.experiencia && (
                <InfoRow label="Experiencia" value={client.client.profile.experiencia} />
              )}
              {client.client?.profile?.frecuencia && (
                <InfoRow label="Frecuencia" value={`${client.client.profile.frecuencia} días/semana`} />
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              {progressLoading ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : !progress ? (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Este cliente aún no tiene una rutina manual asignada.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-emerald-300 font-semibold">
                      Rutina: {progress.assignment?.routine_name}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Sesión {progress.assignment?.current_session_index + 1} de {progress.assignment?.total_sessions}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {progress.progressions?.length === 0 ? (
                      <p className="text-slate-400 text-sm">Sin datos de progresión aún.</p>
                    ) : (
                      progress.progressions.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <p className="text-white font-semibold">{p.exercise_name}</p>
                            <p className="text-slate-400 text-xs uppercase">{p.muscle_group}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-bold">
                              {p.current_weight_kg} kg
                            </span>
                            {p.ready_to_increase && (
                              <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-lime-500 text-slate-900 text-xs font-extrabold">
                                ¡Sube!
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={onAssign}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle size={18} />
            Asignar Rutina
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const VideoCallModal = ({ link, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-emerald-600 to-lime-500 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video size={24} className="text-white" />
          <h3 className="text-white font-extrabold text-lg">Videollamada</h3>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        <p className="text-slate-300 text-sm mb-4">
          Comparte este enlace con tu cliente para iniciar la videollamada:
        </p>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 mb-4">
          <p className="text-emerald-300 font-mono text-sm break-all">{link}</p>
        </div>
        <div className="flex gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
            <Video size={18} /> Unirse
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold"
          >
            Copiar
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-3 border-b border-white/5">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className="text-white font-semibold text-sm">{value}</span>
  </div>
);

export default TrainerDashboardPage;