import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Save, ArrowLeft, Dumbbell, UserPlus, X,
  Upload, AlertCircle, CheckCircle, Loader2, Camera,
  Info, Edit, AlertTriangle, Settings,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const RoutineBuilderPage = ({ token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const headers = { Authorization: `Token ${token}` };

  const topRef = useRef(null);

  // ==================== ESTADO ====================
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [sessions, setSessions] = useState([{ label: 'A', focus: '', slots: [] }]);

  const [editingRoutineId, setEditingRoutineId] = useState(null);

  const [myExercises, setMyExercises] = useState([]);
  const [myRoutines, setMyRoutines] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' });
  const [newExerciseDialog, setNewExerciseDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState({ open: false, routineId: null });
  const [selectedClient, setSelectedClient] = useState('');
  const [editingExercise, setEditingExercise] = useState(null);
  const [editExerciseDialog, setEditExerciseDialog] = useState(false);
  const [editExerciseData, setEditExerciseData] = useState({
    name: '', muscle_group: '', equipment: '', description: '',
  });

  const [newExercise, setNewExercise] = useState({
    name: '', muscle_group: 'pecho', equipment: '',
    increment_type: 'kg_2_5', plate_weight_kg: '', description: '', image: null,
  });

  // 🆕 Referencia para evitar doble-submit
  const isSavingRef = useRef(false);

  const MUSCLE_GROUPS = [
    ['pecho', 'Pecho'], ['espalda', 'Espalda'], ['piernas', 'Piernas'],
    ['hombros', 'Hombros'], ['biceps', 'Bíceps'], ['triceps', 'Tríceps'],
    ['core', 'Core'], ['gluteos', 'Glúteos'], ['cardio', 'Cardio'],
    ['full_body', 'Full Body'],
  ];

  const INCREMENT_TYPES = [
    ['plate', 'Placa de máquina'],
    ['kg_2_5', 'Peso libre +2.5 kg'],
    ['kg_5', 'Peso libre +5 kg'],
    ['bodyweight', 'Peso corporal'],
    ['custom', 'Personalizado'],
  ];

  // ==================== CARGA INICIAL ====================
  useEffect(() => {
    console.log('🟢 RoutineBuilderPage montado');
    loadExercises();
    loadRoutines();
    loadAllUsers();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rid = params.get('routine_id');
    const clientId = params.get('client_id');

    console.log('🔍 Query params:', { rid, clientId });

    if (rid) {
      loadRoutineForEdit(rid);
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } else {
      setEditingRoutineId(null);
    }
    if (clientId) {
      setSelectedClient(clientId);
    }
  }, [location.search]);

  const loadExercises = async () => {
    try {
      const r = await axios.get(`${API_URL}/api/workouts/exercise-templates/`, { headers });
      setMyExercises(r.data);
      console.log('✅ Ejercicios cargados:', r.data.length);
    } catch (e) {
      console.error('❌ Error ejercicios:', e);
    }
  };

  const loadRoutines = async () => {
    try {
      const r = await axios.get(`${API_URL}/api/workouts/routine-templates/`, { headers });
      setMyRoutines(r.data);
      console.log('✅ Rutinas cargadas:', r.data.length);
    } catch (e) {
      console.error('❌ Error rutinas:', e);
    }
  };

  const loadAllUsers = async () => {
    try {
      const r = await axios.get(`${API_URL}/api/users/trainer/all-users/`, { headers });
      setAllUsers(r.data);
      console.log('✅ Usuarios cargados:', r.data.length);
    } catch (e) {
      console.error('❌ Error usuarios:', e);
    }
  };

  const loadRoutineForEdit = async (routineId) => {
    try {
      const r = await axios.get(`${API_URL}/api/workouts/routine-templates/${routineId}/`, { headers });
      const data = r.data;
      setRoutineName(data.name);
      setRoutineDescription(data.description || '');
      setEditingRoutineId(data.id);

      const loadedSessions = (data.sessions || []).map(s => ({
        id: s.id,
        label: s.label,
        focus: s.focus,
        slots: (s.slots || []).map(sl => ({
          id: sl.id,
          exercise_template_id: sl.exercise_template_id,
          role: sl.role,
          order: sl.order,
          initial_weight_kg: sl.initial_weight_kg,
          target_reps_min: sl.target_reps_min,
          target_reps_max: sl.target_reps_max,
          target_sets: sl.target_sets,
          rest_seconds: sl.rest_seconds,
          notes: sl.notes || '',
        })),
      }));

      setSessions(loadedSessions.length ? loadedSessions : [{ label: 'A', focus: '', slots: [] }]);
      setSnack({ open: true, msg: '✏️ Modo edición activado', sev: 'info' });

      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (e) {
      console.error('❌ Error cargando rutina para editar:', e);
      setSnack({ open: true, msg: 'Error al cargar rutina para edición', sev: 'error' });
    }
  };

  const cancelEdit = () => {
    navigate('/routine-builder');
    setEditingRoutineId(null);
    setRoutineName('');
    setRoutineDescription('');
    setSessions([{ label: 'A', focus: '', slots: [] }]);
    setSnack({ open: true, msg: 'Edición cancelada', sev: 'info' });
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const goToSettings = () => {
    navigate('/editar-perfil');
  };

  // ==================== CREAR EJERCICIO ====================
  const handleCreateExercise = async () => {
    if (!newExercise.name.trim()) {
      setSnack({ open: true, msg: 'El nombre es obligatorio', sev: 'warning' });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', newExercise.name);
      formData.append('muscle_group', newExercise.muscle_group);
      formData.append('equipment', newExercise.equipment || '');
      formData.append('increment_type', newExercise.increment_type);
      formData.append('description', newExercise.description || '');
      if (newExercise.plate_weight_kg) {
        formData.append('plate_weight_kg', newExercise.plate_weight_kg);
      }
      if (newExercise.image) {
        formData.append('image', newExercise.image);
      }

      await axios.post(`${API_URL}/api/workouts/exercise-templates/`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });

      setSnack({ open: true, msg: '✅ Ejercicio creado', sev: 'success' });
      setNewExerciseDialog(false);
      setNewExercise({
        name: '', muscle_group: 'pecho', equipment: '',
        increment_type: 'kg_2_5', plate_weight_kg: '', description: '', image: null,
      });
      loadExercises();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: 'Error al crear ejercicio', sev: 'error' });
    }
  };

  const openEditExercise = (ex) => {
    setEditingExercise(ex.id);
    setEditExerciseData({
      name: ex.name,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment || '',
      description: ex.description || '',
      increment_type: ex.increment_type || 'kg_2_5',
      plate_weight_kg: ex.plate_weight_kg ?? '',
      image: null,
      current_image_url: ex.image_url || null,
    });
    setEditExerciseDialog(true);
  };

  const handleUpdateExercise = async () => {
    if (!editExerciseData.name.trim()) {
      setSnack({ open: true, msg: 'El nombre es obligatorio', sev: 'warning' });
      return;
    }
    try {
      const hasImage = editExerciseData.image;
      const url = `${API_URL}/api/workouts/exercise-templates/${editingExercise}/`;
      if (hasImage) {
        const formData = new FormData();
        formData.append('name', editExerciseData.name);
        formData.append('muscle_group', editExerciseData.muscle_group);
        formData.append('equipment', editExerciseData.equipment || '');
        formData.append('description', editExerciseData.description || '');
        formData.append('increment_type', editExerciseData.increment_type);
        if (editExerciseData.plate_weight_kg) {
          formData.append('plate_weight_kg', editExerciseData.plate_weight_kg);
        }
        formData.append('image', editExerciseData.image);
        await axios.put(url, formData, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.put(url, editExerciseData, { headers });
      }
      setSnack({ open: true, msg: '✅ Ejercicio actualizado', sev: 'success' });
      setEditExerciseDialog(false);
      setEditingExercise(null);
      loadExercises();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: 'Error al actualizar ejercicio', sev: 'error' });
    }
  };

  const handleDeleteExercise = async (exId) => {
    if (!window.confirm('¿Eliminar este ejercicio del catálogo? Las rutinas que lo usan no se verán afectadas.')) return;
    try {
      await axios.delete(`${API_URL}/api/workouts/exercise-templates/${exId}/`, { headers });
      setSnack({ open: true, msg: '🗑️ Ejercicio eliminado', sev: 'success' });
      loadExercises();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: 'No se puede eliminar (está en uso)', sev: 'error' });
    }
  };

  // ==================== SESIONES ====================
  const addSession = () => {
    const letters = 'ABCDEFGH';
    setSessions([...sessions, { label: letters[sessions.length], focus: '', slots: [] }]);
  };

  const removeSession = (idx) => {
    if (!window.confirm('¿Eliminar esta sesión completa?')) return;
    const copy = [...sessions];
    copy.splice(idx, 1);
    setSessions(copy);
  };

  const updateSessionField = (idx, field, value) => {
    const copy = [...sessions];
    copy[idx][field] = value;
    setSessions(copy);
  };

  // ==================== SLOTS ====================
  const addSlot = (sIdx) => {
    const copy = [...sessions];
    if (copy[sIdx].slots.length >= 5) {
      setSnack({ open: true, msg: 'Máximo 5 ejercicios por sesión', sev: 'warning' });
      return;
    }
    const mainsCount = copy[sIdx].slots.filter(s => s.role === 'main').length;
    const defaultRole = mainsCount < 3 ? 'main' : 'secondary';
    copy[sIdx].slots.push({
      exercise_template_id: '',
      role: defaultRole,
      order: copy[sIdx].slots.length + 1,
      initial_weight_kg: 0,
      target_reps_min: 12,
      target_reps_max: 15,
      target_sets: 3,
      rest_seconds: 60,
      notes: '',
    });
    setSessions(copy);
  };

  const updateSlot = (sIdx, slotIdx, field, value) => {
    const copy = [...sessions];
    copy[sIdx].slots[slotIdx][field] = value;
    setSessions(copy);
  };

  const removeSlot = (sIdx, slotIdx) => {
    const copy = [...sessions];
    copy[sIdx].slots.splice(slotIdx, 1);
    copy[sIdx].slots.forEach((s, i) => s.order = i + 1);
    setSessions(copy);
  };

  // ==================== GUARDAR / EDITAR RUTINA ====================
  const saveRoutine = async () => {
    // 🆕 Evitar doble click
    if (isSavingRef.current) {
      console.log('⏸️ Ya está guardando, ignorando click...');
      return;
    }

    console.log('🚀 Iniciando saveRoutine...');

    if (!routineName.trim()) {
      setSnack({ open: true, msg: 'Ponle nombre a la rutina', sev: 'warning' });
      return;
    }

    for (const s of sessions) {
      if (s.slots.length !== 5) {
        setSnack({ open: true, msg: `La Sesión ${s.label} debe tener exactamente 5 ejercicios (tiene ${s.slots.length}).`, sev: 'warning' });
        return;
      }
      const mains = s.slots.filter(sl => sl.role === 'main').length;
      const secondaries = s.slots.filter(sl => sl.role === 'secondary').length;
      if (mains !== 3 || secondaries !== 2) {
        setSnack({ open: true, msg: `La Sesión ${s.label} debe tener 3 principales y 2 secundarios (tiene ${mains} y ${secondaries}).`, sev: 'warning' });
        return;
      }
      const missing = s.slots.some(sl => !sl.exercise_template_id);
      if (missing) {
        setSnack({ open: true, msg: `Falta seleccionar un ejercicio en la Sesión ${s.label}`, sev: 'warning' });
        return;
      }
    }

    isSavingRef.current = true;
    setLoading(true);

    try {
      let routineId;

      // 🆕 MODO EDICIÓN
      if (editingRoutineId) {
        console.log('✏️ Modo edición, actualizando rutina:', editingRoutineId);
        await axios.put(
          `${API_URL}/api/workouts/routine-templates/${editingRoutineId}/`,
          { name: routineName, description: routineDescription, duration_weeks: 4 },
          { headers }
        );
        routineId = editingRoutineId;
      } else {
        // CREACIÓN
        console.log('🆕 Creando nueva rutina...');
        const r = await axios.post(
          `${API_URL}/api/workouts/routine-templates/`,
          { name: routineName, description: routineDescription, duration_weeks: 4 },
          { headers }
        );
        routineId = r.data.id;
        console.log('✅ Rutina creada con ID:', routineId);
      }

      // Iterar sesiones
      for (const s of sessions) {
        let sessionId = s.id;

        if (sessionId) {
          // Sincronizar slots: borrar los que ya no están en la UI (sección de edición)
          try {
            const existingSession = await axios.get(
              `${API_URL}/api/workouts/session-templates/${sessionId}/`,
              { headers }
            );
            const dbSlotIds = (existingSession.data.slots || []).map(sl => sl.id);
            const uiSlotIds = s.slots.filter(sl => sl.id).map(sl => sl.id);
            for (const removedId of dbSlotIds) {
              if (!uiSlotIds.includes(removedId)) {
                await axios.delete(`${API_URL}/api/workouts/slots/${removedId}/delete/`, { headers });
              }
            }
          } catch (e) {
            console.error('⚠️ Error sincronizando slots de la sesión', sessionId, e);
          }

          await axios.put(
            `${API_URL}/api/workouts/session-templates/${sessionId}/`,
            { label: s.label, focus: s.focus, order: sessions.indexOf(s) + 1 },
            { headers }
          );
        } else {
          const sessionResp = await axios.post(
            `${API_URL}/api/workouts/routine-templates/${routineId}/add-session/`,
            { label: s.label, focus: s.focus, order: sessions.indexOf(s) + 1 },
            { headers }
          );
          sessionId = sessionResp.data.id;
        }

        for (const slot of s.slots) {
          await axios.post(
            `${API_URL}/api/workouts/session-templates/${sessionId}/add-slot/`,
            { ...slot, id: slot.id || undefined },
            { headers }
          );
        }
      }

      console.log('✅ Rutina guardada completamente');

      setSnack({
        open: true,
        msg: editingRoutineId ? '✅ Rutina actualizada' : '✅ Rutina guardada exitosamente',
        sev: 'success',
      });
      loadRoutines();

      // ========== LÓGICA DE REDIRECCIÓN ==========
      if (selectedClient) {
        // Caso 1: cliente preseleccionado → asignar automáticamente
        console.log('📌 Cliente preseleccionado, asignando...');
        try {
          await axios.post(
            `${API_URL}/api/workouts/routine-templates/${routineId}/assign/`,
            { client_id: selectedClient },
            { headers }
          );
          setSnack({ open: true, msg: '✅ Rutina asignada al cliente', sev: 'success' });
          setTimeout(() => navigate('/dashboard'), 1500);
        } catch (e) {
          console.error('Error al asignar:', e);
          // Si falla, mostrar diálogo
          setAssignDialog({ open: true, routineId });
        }
      } else if (editingRoutineId) {
        // Caso 2: edición sin cliente → volver al dashboard
        console.log('✏️ Edición completa, volviendo al dashboard...');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        // Caso 3: rutina nueva sin cliente → abrir diálogo de asignación
        console.log('❓ Sin cliente, abriendo diálogo de asignación...');
        setTimeout(() => {
          setAssignDialog({ open: true, routineId });
        }, 500);
      }
    } catch (e) {
      console.error('❌ Error al guardar:', e);
      console.error('Response:', e.response?.data);
      setSnack({
        open: true,
        msg: 'Error al guardar la rutina: ' + (e.response?.data?.error || e.message),
        sev: 'error',
      });
    } finally {
      setLoading(false);
      isSavingRef.current = false;
    }
  };

  const handleDeleteRoutine = async () => {
    if (!editingRoutineId) return;
    if (!window.confirm('¿Seguro que quieres eliminar esta rutina? Esta acción no se puede deshacer.')) return;
    try {
      await axios.delete(`${API_URL}/api/workouts/routine-templates/${editingRoutineId}/`, { headers });
      setSnack({ open: true, msg: '🗑️ Rutina eliminada', sev: 'success' });
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: 'Error al eliminar la rutina', sev: 'error' });
    }
  };

  const handleDeleteRoutineFromList = async (routineId) => {
    if (!window.confirm('¿Eliminar esta rutina?')) return;
    try {
      await axios.delete(`${API_URL}/api/workouts/routine-templates/${routineId}/`, { headers });
      setSnack({ open: true, msg: '🗑️ Rutina eliminada', sev: 'success' });
      loadRoutines();
    } catch (e) {
      setSnack({ open: true, msg: 'Error al eliminar', sev: 'error' });
    }
  };

  // ==================== ASIGNAR A CLIENTE ====================
  const handleAssign = async () => {
    if (!selectedClient) {
      setSnack({ open: true, msg: 'Selecciona un cliente', sev: 'warning' });
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/workouts/routine-templates/${assignDialog.routineId}/assign/`,
        { client_id: selectedClient },
        { headers }
      );
      setSnack({ open: true, msg: '✅ Rutina asignada al cliente', sev: 'success' });
      setAssignDialog({ open: false, routineId: null });
      setSelectedClient('');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (e) {
      setSnack({ open: true, msg: 'Error al asignar rutina', sev: 'error' });
    }
  };

  // 🆕 Cerrar diálogo de asignación sin asignar
  const skipAssign = () => {
    setAssignDialog({ open: false, routineId: null });
    setSnack({ open: true, msg: 'Rutina guardada sin asignar. Puedes asignarla después desde el panel.', sev: 'info' });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const preselectedUser = allUsers.find(u => String(u.id) === String(selectedClient));

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* NAVBAR */}
      <nav className="relative z-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">

          <button
            onClick={goBack}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-slate-300 hover:text-emerald-400"
            title="Volver al panel principal"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-semibold">Volver</span>
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-gradient-to-br from-emerald-400 to-lime-400 p-2 rounded-xl shadow-lg shadow-emerald-500/30 shrink-0">
              <Dumbbell size={20} className="text-slate-900" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-extrabold text-lg leading-tight truncate">
                {editingRoutineId ? 'Editar Rutina' : 'Crear Rutina'}
              </h1>
              <p className="text-emerald-300 text-xs font-medium uppercase tracking-widest truncate">
                {editingRoutineId ? `Editando ID #${editingRoutineId}` : 'Constructor Manual'}
              </p>
            </div>
          </div>

          <button
            onClick={goToSettings}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-all shrink-0"
            title="Configuración de mi cuenta"
          >
            <Settings size={18} />
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8" ref={topRef}>

        {/* Barra sticky modo edición */}
        {editingRoutineId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-16 z-30 mb-6 p-4 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Edit size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-300 font-bold text-sm">Modo edición activo</p>
                  <p className="text-slate-400 text-xs">Los cambios reemplazarán la versión actual</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-semibold flex items-center gap-2 transition-all"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  onClick={saveRoutine}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cliente preseleccionado */}
        {preselectedUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3"
          >
            <CheckCircle className="text-emerald-400" size={20} />
            <span className="text-emerald-300 font-semibold">
              Esta rutina se asignará a: <strong>{preselectedUser.name}</strong> ({preselectedUser.email})
            </span>
          </motion.div>
        )}

        {/* Datos generales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Info size={20} className="text-lime-400" />
            Datos Generales
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">
                Nombre de la rutina *
              </label>
              <input
                type="text"
                value={routineName}
                onChange={e => setRoutineName(e.target.value)}
                placeholder="Ej: Rutina Fuerza Mes 1"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">
                Descripción (opcional)
              </label>
              <textarea
                value={routineDescription}
                onChange={e => setRoutineDescription(e.target.value)}
                rows={2}
                placeholder="Ej: Rutina enfocada en fuerza base"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
              />
            </div>

            <button
              onClick={() => setNewExerciseDialog(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-lime-500/20 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center justify-center gap-2 hover:from-emerald-500/30 hover:to-lime-500/30 transition-all"
            >
              <Camera size={18} />
              Añadir nuevo ejercicio al catálogo
            </button>
          </div>
        </motion.div>

        {/* Catálogo */}
        {myExercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
          >
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Dumbbell size={20} className="text-lime-400" />
              Catálogo de Ejercicios ({myExercises.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
              {myExercises.map(ex => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{ex.name}</p>
                    <p className="text-slate-500 text-xs">{ex.muscle_group_display || ex.muscle_group}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditExercise(ex)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-all"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sesiones */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Dumbbell size={20} className="text-lime-400" />
              Sesiones ({sessions.length})
            </h2>
            <button
              onClick={addSession}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              Añadir sesión
            </button>
          </div>

          {sessions.map((s, sIdx) => (
            <motion.div
              key={s.id || sIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-4"
            >
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-extrabold text-sm">
                  Sesión {s.label}
                </span>
                <input
                  type="text"
                  placeholder="Enfoque (ej: Empuje)"
                  value={s.focus}
                  onChange={e => updateSessionField(sIdx, 'focus', e.target.value)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none text-sm"
                />
                <span className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                  s.slots.filter(x => x.role === 'main').length === 3 && s.slots.filter(x => x.role === 'secondary').length === 2
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {s.slots.filter(x => x.role === 'main').length}/3 principales · {s.slots.filter(x => x.role === 'secondary').length}/2 secundarios
                </span>
                {sessions.length > 1 && (
                  <button
                    onClick={() => removeSession(sIdx)}
                    className="ml-auto w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {s.slots.map((slot, slotIdx) => (
                <div
                  key={slot.id || slotIdx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 mb-3 bg-slate-900/40 border border-white/5 rounded-2xl"
                >
                  <div className="md:col-span-3">
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">Ejercicio</label>
                    <select
                      value={slot.exercise_template_id}
                      onChange={e => updateSlot(sIdx, slotIdx, 'exercise_template_id', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    >
                      <option value="" className="bg-slate-900">Seleccionar...</option>
                      {myExercises.map(ex => (
                        <option key={ex.id} value={ex.id} className="bg-slate-900">{ex.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">Rol</label>
                    <select
                      value={slot.role}
                      onChange={e => updateSlot(sIdx, slotIdx, 'role', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    >
                      <option value="main" className="bg-slate-900">Principal</option>
                      <option value="secondary" className="bg-slate-900">Secundario</option>
                    </select>
                  </div>

                  <NumberInput
                    label="Peso (kg)"
                    value={slot.initial_weight_kg}
                    onChange={v => updateSlot(sIdx, slotIdx, 'initial_weight_kg', v)}
                    className="md:col-span-2"
                  />
                  <NumberInput
                    label="Reps mín"
                    value={slot.target_reps_min}
                    onChange={v => updateSlot(sIdx, slotIdx, 'target_reps_min', v)}
                    className="md:col-span-1"
                  />
                  <NumberInput
                    label="Reps máx"
                    value={slot.target_reps_max}
                    onChange={v => updateSlot(sIdx, slotIdx, 'target_reps_max', v)}
                    className="md:col-span-1"
                  />
                  <NumberInput
                    label="Series"
                    value={slot.target_sets}
                    onChange={v => updateSlot(sIdx, slotIdx, 'target_sets', v)}
                    className="md:col-span-1"
                  />
                  <NumberInput
                    label="Desc. (s)"
                    value={slot.rest_seconds}
                    onChange={v => updateSlot(sIdx, slotIdx, 'rest_seconds', v)}
                    className="md:col-span-1"
                  />

                  <div className="md:col-span-1 flex items-end">
                    <button
                      onClick={() => removeSlot(sIdx, slotIdx)}
                      className="w-full h-[38px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => addSlot(sIdx)}
                disabled={s.slots.length >= 5}
                className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Añadir ejercicio ({s.slots.length}/5)
              </button>
            </motion.div>
          ))}
        </div>

        {/* Guardar */}
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.99 }}
          onClick={saveRoutine}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-700 hover:to-lime-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={22} />
              Guardando...
            </>
          ) : (
            <>
              <Save size={22} />
              {editingRoutineId ? 'Guardar Cambios' : 'Guardar Rutina'}
            </>
          )}
        </motion.button>

        {/* Eliminar rutina (solo edición) */}
        {editingRoutineId && (
          <button
            onClick={handleDeleteRoutine}
            className="w-full mt-3 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={18} />
            Eliminar Rutina
          </button>
        )}

        {/* Volver al panel */}
        <button
          onClick={goBack}
          className="w-full mt-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft size={18} />
          Volver al panel principal
        </button>

        {/* Mis rutinas creadas */}
        {!editingRoutineId && myRoutines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
          >
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Dumbbell size={20} className="text-lime-400" />
              Mis Rutinas Creadas ({myRoutines.length})
            </h2>

            <div className="space-y-2">
              {myRoutines.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all flex-wrap gap-3"
                >
                  <div>
                    <p className="text-white font-semibold">{r.name}</p>
                    <p className="text-slate-400 text-xs">
                      {r.total_sessions} sesiones · {r.duration_weeks} semanas
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/routine-builder?routine_id=${r.id}`)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-lime-500/50 text-slate-300 hover:text-lime-400 text-sm font-semibold flex items-center gap-2 transition-all"
                      title="Editar"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => setAssignDialog({ open: true, routineId: r.id })}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                      title="Asignar"
                    >
                      <UserPlus size={16} />
                      Asignar
                    </button>
                    <button
                      onClick={() => handleDeleteRoutineFromList(r.id)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* DIÁLOGO: NUEVO EJERCICIO */}
      {newExerciseDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl my-8"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-lime-500 p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <Dumbbell size={22} className="text-white" />
                <h3 className="text-white font-extrabold text-lg">Nuevo Ejercicio</h3>
              </div>
              <button
                onClick={() => setNewExerciseDialog(false)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <FormField label="Nombre del ejercicio *">
                <input
                  type="text"
                  value={newExercise.name}
                  onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                  placeholder="Ej: Press de banca"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none text-sm"
                />
              </FormField>

              <FormField label="Grupo muscular">
                <select
                  value={newExercise.muscle_group}
                  onChange={e => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                >
                  {MUSCLE_GROUPS.map(([v, l]) => (
                    <option key={v} value={v} className="bg-slate-900">{l}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Equipamiento (opcional)">
                <input
                  type="text"
                  value={newExercise.equipment}
                  onChange={e => setNewExercise({ ...newExercise, equipment: e.target.value })}
                  placeholder="Ej: Barra, mancuernas, máquina..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none text-sm"
                />
              </FormField>

              <FormField label="Tipo de incremento (progresión)">
                <select
                  value={newExercise.increment_type}
                  onChange={e => setNewExercise({ ...newExercise, increment_type: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                >
                  {INCREMENT_TYPES.map(([v, l]) => (
                    <option key={v} value={v} className="bg-slate-900">{l}</option>
                  ))}
                </select>
              </FormField>

              {newExercise.increment_type === 'plate' && (
                <FormField label="Peso de 1 placa (kg)">
                  <input
                    type="number"
                    value={newExercise.plate_weight_kg}
                    onChange={e => setNewExercise({ ...newExercise, plate_weight_kg: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                  />
                </FormField>
              )}

              <FormField label="Foto de la máquina (opcional)">
                <label className="w-full px-4 py-3 bg-white/5 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 cursor-pointer flex items-center gap-3 transition-all">
                  <Upload size={18} />
                  <span className="text-sm">
                    {newExercise.image ? newExercise.image.name : 'Subir imagen'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewExercise({ ...newExercise, image: e.target.files[0] })}
                    className="hidden"
                  />
                </label>
              </FormField>

              <FormField label="Descripción / Notas">
                <textarea
                  value={newExercise.description}
                  onChange={e => setNewExercise({ ...newExercise, description: e.target.value })}
                  rows={2}
                  placeholder="Técnica, tips..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none text-sm resize-none"
                />
              </FormField>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 justify-end rounded-b-3xl">
              <button
                onClick={() => setNewExerciseDialog(false)}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateExercise}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-500/30"
              >
                Crear ejercicio
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DIÁLOGO: EDITAR EJERCICIO */}
      {editExerciseDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-md w-full shadow-2xl"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-lime-500 p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <Edit size={22} className="text-white" />
                <h3 className="text-white font-extrabold text-lg">Editar Ejercicio</h3>
              </div>
              <button
                onClick={() => { setEditExerciseDialog(false); setEditingExercise(null); }}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <FormField label="Nombre">
                <input
                  type="text"
                  value={editExerciseData.name}
                  onChange={e => setEditExerciseData({ ...editExerciseData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                />
              </FormField>

              <FormField label="Grupo muscular">
                <select
                  value={editExerciseData.muscle_group}
                  onChange={e => setEditExerciseData({ ...editExerciseData, muscle_group: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                >
                  {MUSCLE_GROUPS.map(([v, l]) => (
                    <option key={v} value={v} className="bg-slate-900">{l}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Equipamiento">
                <input
                  type="text"
                  value={editExerciseData.equipment}
                  onChange={e => setEditExerciseData({ ...editExerciseData, equipment: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                />
              </FormField>

              <FormField label="Tipo de incremento (progresión)">
                <select
                  value={editExerciseData.increment_type}
                  onChange={e => setEditExerciseData({ ...editExerciseData, increment_type: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                >
                  {INCREMENT_TYPES.map(([v, l]) => (
                    <option key={v} value={v} className="bg-slate-900">{l}</option>
                  ))}
                </select>
              </FormField>

              {editExerciseData.increment_type === 'plate' && (
                <FormField label="Peso de 1 placa (kg)">
                  <input
                    type="number"
                    value={editExerciseData.plate_weight_kg}
                    onChange={e => setEditExerciseData({ ...editExerciseData, plate_weight_kg: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
                  />
                </FormField>
              )}

              <FormField label="Foto de la máquina">
                <label className="w-full px-4 py-3 bg-white/5 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 cursor-pointer flex items-center gap-3 transition-all">
                  {editExerciseData.current_image_url && !editExerciseData.image && (
                    <img
                      src={editExerciseData.current_image_url.startsWith('http')
                        ? editExerciseData.current_image_url
                        : `${API_URL}${editExerciseData.current_image_url}`}
                      alt="Actual"
                      className="h-12 w-12 object-cover rounded-lg"
                    />
                  )}
                  <Upload size={18} />
                  <span className="text-sm">
                    {editExerciseData.image
                      ? editExerciseData.image.name
                      : editExerciseData.current_image_url ? 'Cambiar foto' : 'Subir imagen'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setEditExerciseData({ ...editExerciseData, image: e.target.files[0] })}
                    className="hidden"
                  />
                </label>
              </FormField>

              <FormField label="Descripción">
                <textarea
                  value={editExerciseData.description}
                  onChange={e => setEditExerciseData({ ...editExerciseData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm resize-none"
                />
              </FormField>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 justify-end rounded-b-3xl">
              <button
                onClick={() => { setEditExerciseDialog(false); setEditingExercise(null); }}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateExercise}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-500/30"
              >
                Guardar cambios
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DIÁLOGO: ASIGNAR A CLIENTE */}
      {assignDialog.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-md w-full shadow-2xl"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-lime-500 p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <UserPlus size={22} className="text-white" />
                <h3 className="text-white font-extrabold text-lg">Asignar Rutina</h3>
              </div>
              <button
                onClick={() => setAssignDialog({ open: false, routineId: null })}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-400 text-sm">
                Selecciona el usuario al que quieres asignar esta rutina:
              </p>

              <select
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 focus:outline-none text-sm"
              >
                <option value="" className="bg-slate-900">Seleccionar usuario...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900">
                    {u.name} ({u.email}) {u.is_mine ? '· Mi cliente' : u.has_trainer ? '· Otro entrenador' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 🆕 Footer con 3 botones: Cancelar, Saltar, Asignar */}
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end rounded-b-3xl flex-wrap">
              <button
                onClick={() => setAssignDialog({ open: false, routineId: null })}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold text-sm"
              >
                Volver
              </button>
              <button
                onClick={skipAssign}
                className="px-6 py-3 rounded-xl bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 text-slate-300 font-semibold text-sm flex items-center gap-2"
              >
                Asignar después
              </button>
              <button
                onClick={handleAssign}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-500/30"
              >
                Asignar ahora
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Snackbar */}
      {snack.open && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-6 py-4 rounded-2xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl ${
              snack.sev === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
              snack.sev === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
              snack.sev === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
              'bg-slate-500/20 border-slate-500/30 text-slate-300'
            }`}
          >
            {snack.sev === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{snack.msg}</span>
            <button
              onClick={() => setSnack({ ...snack, open: false })}
              className="ml-2 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ==================== SUB-COMPONENTES ====================

const FormField = ({ label, children }) => (
  <div>
    <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

const NumberInput = ({ label, value, onChange, className = '' }) => (
  <div className={className}>
    <label className="text-xs text-slate-400 font-semibold mb-1 block">{label}</label>
    <input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-500/50 focus:outline-none"
    />
  </div>
);

export default RoutineBuilderPage;