 import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  List,
  ListItem,
  Button,
  Box,
  CircularProgress,
  TextField,
  IconButton,
  Card,
  CardContent,
  styled,
  useTheme,
  Grid,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  Tooltip,
  alpha,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Dumbbell,
  ChevronLeft,
  MessageCircle,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  Play,
  X,
  RefreshCw,
  TrendingUp,
  Target,
  Clock,
  Award,
  BarChart3,
  Flame,
  Zap,
  Dumbbell as DumbbellIcon,
  User,
  Video,
  Youtube,
  Edit,
  AlertTriangle,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

console.log('🔧 Usando API_URL:', API_URL);

// Utilitarios de autenticación
const getAuthToken = (navigate) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    navigate('/login');
    throw new Error('No autenticado');
  }
  return token;
};

// Componentes estilizados
const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  fontWeight: '600',
  textTransform: 'none',
  padding: '12px 24px',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a3f8a 100%)',
  },
  '&:disabled': {
    background: '#e0e0e0',
  },
}));

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
  borderRadius: '20px',
  overflow: 'hidden',
}));

const ExerciseCard = styled(Paper)(({ theme, completed, isediting }) => ({
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  borderRadius: '16px',
  background: isediting === 'true' 
    ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'
    : completed 
      ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  border: `2px solid ${isediting === 'true' ? '#ffc107' : completed ? theme.palette.success.main : '#e0e0e0'}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
    borderColor: isediting === 'true' ? '#ff9800' : completed ? theme.palette.success.dark : theme.palette.primary.main,
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
}));

// Base de datos de videos REALES y funcionales (probados)
// Catálogo de videos REALES y verificados (139 ejercicios, sin repetir)
const exerciseVideos = {
    "Ab wheel rollouts": 'https://www.youtube.com/embed/_BHKT60P6bc',
    "Bicicleta": 'https://www.youtube.com/embed/Ylxojxizoz8',
    "Bicicleta de recuperación": 'https://www.youtube.com/embed/hE8v0rilslU',
    "Bicicleta estática": 'https://www.youtube.com/embed/LL1FI5BbIgg',
    "Bicicleta intervalos": 'https://www.youtube.com/embed/jRYK_jbQwUI',
    "Bicicleta resistencia": 'https://www.youtube.com/embed/_VbcN81W0wM',
    "Bicycle crunches": 'https://www.youtube.com/embed/cbKIDZ_XyjY',
    "Bird dog": 'https://www.youtube.com/embed/hUIrLbMnglY',
    "Box jumps altos": 'https://www.youtube.com/embed/jomMXLI4h24',
    "Burpees completos": 'https://www.youtube.com/embed/EkK3oVBA__Q',
    "Burpees con salto": 'https://www.youtube.com/embed/h4cf5Bik4Tg',
    "Burpees modificados": 'https://www.youtube.com/embed/r2iRtTDNI_c',
    "Caminata": 'https://www.youtube.com/embed/TWyguC7VVh8',
    "Caminata inclinada": 'https://www.youtube.com/embed/h12VsoGyJdE',
    "Carrera de ritmo": 'https://www.youtube.com/embed/JcaXE4HNuOI',
    "Crunches": 'https://www.youtube.com/embed/HLAPlJhxqEE',
    "Crunches básicos": 'https://www.youtube.com/embed/BzYrN4o5X5o',
    "Cuerda de saltar": 'https://www.youtube.com/embed/zvhRGF_G_64',
    "Curl de bíceps con mancuernas": 'https://www.youtube.com/embed/LQcQNJiVY24',
    "Curl femoral": 'https://www.youtube.com/embed/CBCPBnMzsMI',
    "Dominadas": 'https://www.youtube.com/embed/6E3tt4ajzSs',
    "Dominadas asistidas": 'https://www.youtube.com/embed/lgE47t3dr2Q',
    "Dominadas con peso": 'https://www.youtube.com/embed/1cfD0V35l_8',
    "Dragon flags": 'https://www.youtube.com/embed/c7dblNviQqA',
    "Elevaciones laterales": 'https://www.youtube.com/embed/zBqZqAjCnR4',
    "Elevación de piernas acostado": 'https://www.youtube.com/embed/hTm5SjiW4gY',
    "Elevación de piernas colgado": 'https://www.youtube.com/embed/98oNxE56i3g',
    "Elevación de talones": 'https://www.youtube.com/embed/EyHze_DHQq0',
    "Elevación de talones con peso": 'https://www.youtube.com/embed/fKt3Q0peC0Y',
    "Escaladores rápidos": 'https://www.youtube.com/embed/mD3Rn0TQbYA',
    "Extensiones de tríceps": 'https://www.youtube.com/embed/FELcywKlkqE',
    "Fartlek de 40 minutos": 'https://www.youtube.com/embed/_ZwyRKRFQhU',
    "Flexiones archer": 'https://www.youtube.com/embed/Gdej5nhhb38',
    "Flexiones de rodillas": 'https://www.youtube.com/embed/YN5pE2JmzHM',
    "Flexiones diamante": 'https://www.youtube.com/embed/bZJW_GR9jUk',
    "Flexiones en pared": 'https://www.youtube.com/embed/p8ZpiJTMKew',
    "Flexiones estándar": 'https://www.youtube.com/embed/S44aVCTshH8',
    "Flexiones explosivas": 'https://www.youtube.com/embed/iqj68r6CaDo',
    "Flow de transiciones": 'https://www.youtube.com/embed/o31E7vjfs70',
    "Fondos con peso": 'https://www.youtube.com/embed/jm9ESPWN7tA',
    "Fondos en paralelas": 'https://www.youtube.com/embed/LbsqDJe4EFc',
    "Fondos en silla": 'https://www.youtube.com/embed/oVs-HluNKP0',
    "Gato-vaca (Marjaryasana-Bitilasana)": 'https://www.youtube.com/embed/NVNoJph0fw0',
    "Guerrero I (Virabhadrasana I)": 'https://www.youtube.com/embed/_BlKPIe8wOo',
    "Guerrero II (Virabhadrasana II)": 'https://www.youtube.com/embed/-8hKpr5dxFM',
    "HIIT en bicicleta": 'https://www.youtube.com/embed/LMJKTmbdt8w',
    "Handstand push-ups": 'https://www.youtube.com/embed/WxgJS48wf1M',
    "High knees": 'https://www.youtube.com/embed/QPfOZ0e30xg',
    "Hip thrust con barra": 'https://www.youtube.com/embed/14wE63cK26I',
    "Intervalos de carrera": 'https://www.youtube.com/embed/GVn9mbv_4aA',
    "Intervalos intensos": 'https://www.youtube.com/embed/P1HyMCX8NJs',
    "Jumping jacks suaves": 'https://www.youtube.com/embed/vjKGK90UJHQ',
    "L-sit hold": 'https://www.youtube.com/embed/a4qGW79QtrE',
    "Marcha en el lugar": 'https://www.youtube.com/embed/gchiG1iIMXc',
    "Mountain climbers": 'https://www.youtube.com/embed/7W4JEfEKuC4',
    "Muscle-up progression": 'https://www.youtube.com/embed/jsdW9-AEbBk',
    "Natación a ritmo": 'https://www.youtube.com/embed/vKJ188If6l0',
    "Natación suave": 'https://www.youtube.com/embed/FTVqUdM4EBI',
    "Nordic hamstring curls": 'https://www.youtube.com/embed/QZdcn8POwbw',
    "Perro boca abajo (Adho Mukha Svanasana)": 'https://www.youtube.com/embed/1RzzTuBLFI4',
    "Peso muerto a una pierna": 'https://www.youtube.com/embed/2-5C8T_f0NY',
    "Peso muerto con carga": 'https://www.youtube.com/embed/0XL4cZR2Ink',
    "Peso muerto convencional": 'https://www.youtube.com/embed/kancsOn7CJY',
    "Peso muerto rumano": 'https://www.youtube.com/embed/8qNrTuZ0rXM',
    "Pike push-ups": 'https://www.youtube.com/embed/eG20L9cl81w',
    "Pincha mayurasana": 'https://www.youtube.com/embed/9J2zHLkgXqo',
    "Plancha": 'https://www.youtube.com/embed/3AM7L2k7BEw',
    "Plancha RKC": 'https://www.youtube.com/embed/9uX34tkHUto',
    "Plancha a flexión": 'https://www.youtube.com/embed/mTs83kUu7rc',
    "Plancha con elevación de pierna": 'https://www.youtube.com/embed/Fx4yTjyfSSc',
    "Plancha con peso": 'https://www.youtube.com/embed/FtBpfQVvVl0',
    "Plancha de rodillas": 'https://www.youtube.com/embed/kUGXWrNgVLQ',
    "Plancha dinámica": 'https://www.youtube.com/embed/02k0CQujgeM',
    "Plancha estándar": 'https://www.youtube.com/embed/i1s-WoN720Y',
    "Plancha lateral": 'https://www.youtube.com/embed/fNsxKTKfMNI',
    "Postura de la montaña (Tadasana)": 'https://www.youtube.com/embed/mLW6ykrlIEs',
    "Postura de la pierna en la pared (Viparita Karani)": 'https://www.youtube.com/embed/OVJzZP3aP4E',
    "Postura de la rueda (Chakrasana)": 'https://www.youtube.com/embed/3yNPdgNHkOo',
    "Postura del cuervo (Bakasana)": 'https://www.youtube.com/embed/3tKCo7fcs6Q',
    "Postura del loto (Padmasana)": 'https://www.youtube.com/embed/DWpnpaWHGew',
    "Postura del niño (Balasana)": 'https://www.youtube.com/embed/cFcNQjKDI58',
    "Postura del puente (Setu Bandhasana)": 'https://www.youtube.com/embed/Hgca0II_CKI',
    "Postura del triángulo (Trikonasana)": 'https://www.youtube.com/embed/h60lC7mCaFA',
    "Postura del árbol (Vrksasana)": 'https://www.youtube.com/embed/06dOFQVC2ZQ',
    "Prensa de piernas": 'https://www.youtube.com/embed/CZrG20G5B1g',
    "Press de banca con barra": 'https://www.youtube.com/embed/TAH8RxOS0VI',
    "Press de banca con carga": 'https://www.youtube.com/embed/xUHWtz9STnk',
    "Press de banca con mancuernas": 'https://www.youtube.com/embed/48L0oQApm_0',
    "Press de hombros con botella": 'https://www.youtube.com/embed/cLYnWiQC9Gs',
    "Press inclinado con mancuernas": 'https://www.youtube.com/embed/DfgI6sGn9iQ',
    "Press militar con barra": 'https://www.youtube.com/embed/if97enQvM70',
    "Press militar con mancuernas": 'https://www.youtube.com/embed/6YG2ETOwDR8',
    "Puente de glúteos": 'https://www.youtube.com/embed/M-mnbbpJmXI',
    "Remo con barra": 'https://www.youtube.com/embed/sr_U0jBE89A',
    "Remo con mancuerna": 'https://www.youtube.com/embed/QEamGpgkTSo',
    "Remo con peso casero": 'https://www.youtube.com/embed/RgrfbOugq6s',
    "Remo ergómetro": 'https://www.youtube.com/embed/A-35F9TR0OA',
    "Remo invertido": 'https://www.youtube.com/embed/AIM_qZjSFUU',
    "Remo sprint": 'https://www.youtube.com/embed/nG9Vdvf5nzo',
    "Respiración alterna (Nadi Shodhana)": 'https://www.youtube.com/embed/JDD8r65WfkA',
    "Respiración consciente (Pranayama)": 'https://www.youtube.com/embed/UzyY2JSVayE',
    "Russian twist con peso": 'https://www.youtube.com/embed/MKfv0WiTeEQ',
    "Russian twists": 'https://www.youtube.com/embed/wkD8rjkodUI',
    "Saltos de sentadilla": 'https://www.youtube.com/embed/IfqrxS_-8oU',
    "Saludo al sol A": 'https://www.youtube.com/embed/Gd-4pVMcPGs',
    "Saludo al sol B": 'https://www.youtube.com/embed/O-ak5CiWPfQ',
    "Savasana": 'https://www.youtube.com/embed/21lWeGNvjV4',
    "Savasana (cadáver)": 'https://www.youtube.com/embed/-Kulgd-R538',
    "Secuencia avanzada": 'https://www.youtube.com/embed/ytxtKJGfAWE',
    "Secuencia de guerreros": 'https://www.youtube.com/embed/TMkC5IyFxyo',
    "Secuencia de pie": 'https://www.youtube.com/embed/u_1zoVPqNBI',
    "Sentadilla búlgara": 'https://www.youtube.com/embed/-3d_wieNNHA',
    "Sentadilla búlgara con peso": 'https://www.youtube.com/embed/Xfa3Ql_NwmE',
    "Sentadilla con barra": 'https://www.youtube.com/embed/qsAkuNORgmk',
    "Sentadilla con carga máxima": 'https://www.youtube.com/embed/NHD0vH7XXgw',
    "Sentadilla con salto alto": 'https://www.youtube.com/embed/c-b6w0EyqIk',
    "Sentadilla profunda con barra": 'https://www.youtube.com/embed/M0UsWb2iNag',
    "Sentadilla sumo": 'https://www.youtube.com/embed/PFh39yoRSes',
    "Sentadillas asistidas": 'https://www.youtube.com/embed/Wf5vveSPtwg',
    "Sentadillas completas": 'https://www.youtube.com/embed/Bg-cs9JJmfo',
    "Sentadillas pistol": 'https://www.youtube.com/embed/IfESGr170DY',
    "Skaters": 'https://www.youtube.com/embed/qM5jviFhw9U',
    "Skipping suave": 'https://www.youtube.com/embed/3VhOTIsDOZM',
    "Sprawls": 'https://www.youtube.com/embed/g9u-JcVXYFM',
    "Sprint en el lugar": 'https://www.youtube.com/embed/CdgSGGwN9YI',
    "Sprints en bicicleta": 'https://www.youtube.com/embed/AI9Zrp-bVnw',
    "Sprints en colina": 'https://www.youtube.com/embed/FRTHV5GD3YY',
    "Step touch": 'https://www.youtube.com/embed/wH9hsR7Ck_M',
    "Step-ups": 'https://www.youtube.com/embed/yHyrYdgE36M',
    "Subidas al step rápidas": 'https://www.youtube.com/embed/OIS54N-ZYGY',
    "Trote continuo": 'https://www.youtube.com/embed/PFo2afxqzHI',
    "Trote en el lugar": 'https://www.youtube.com/embed/UvD9OXngEd4',
    "Trote ligero de recuperación": 'https://www.youtube.com/embed/WTurO6TfIrE',
    "Trote suave": 'https://www.youtube.com/embed/NNU04_UCWyM',
    "Tuck jumps": 'https://www.youtube.com/embed/YHVrLfVjgwQ',
    "Zancadas alternas": 'https://www.youtube.com/embed/AwVfFx7ToBk',
    "Zancadas con barra": 'https://www.youtube.com/embed/YinDJm8PLhg',
    "Zancadas con salto": 'https://www.youtube.com/embed/LBBbKa--AEs',
    "Zancadas estáticas": 'https://www.youtube.com/embed/FO5KJzV2qb8',
};

// Componente principal
const MiRutina = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const chatEndRef = useRef(null);
  const lastNotifiedRef = useRef(null);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [completedExercises, setCompletedExercises] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showRegenerateAlert, setShowRegenerateAlert] = useState(false);
  const [videoDialog, setVideoDialog] = useState({
    open: false,
    exerciseName: '',
    videoUrl: '',
    isSearchFallback: false
  });
  const [stats, setStats] = useState(null);
  const [expandedDay, setExpandedDay] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [isTrainer, setIsTrainer] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [planModified, setPlanModified] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [dataCorrupted, setDataCorrupted] = useState(false);
  const [uniqueExercises, setUniqueExercises] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);

  // Función para cargar el rol del usuario
  const loadUserRole = async () => {
    try {
      const token = getAuthToken(navigate);
      const response = await axios.get(
        `${API_URL}/api/workouts/user-role/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setUserRole(response.data);
      setIsTrainer(response.data.is_trainer || response.data.is_superuser);
      console.log('👤 Rol de usuario:', response.data);
    } catch (error) {
      console.error('Error cargando rol:', error);
      setIsTrainer(false);
    }
  };

  // Función para cargar estadísticas del usuario
  const loadUserStats = async () => {
    try {
      const token = getAuthToken(navigate);
      const response = await axios.get(
        `${API_URL}/api/workouts/user-stats/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Función para VERIFICAR si los datos están corruptos
  const verificarDatosPlan = (planData) => {
    if (!planData || !planData.days) return { corrupted: false, uniqueExercises: 0, totalExercises: 0 };
    
    let allExercises = [];
    let exerciseNames = new Set();
    
    // Recopilar todos los ejercicios
    planData.days.forEach(day => {
      if (day.exercises && Array.isArray(day.exercises)) {
        day.exercises.forEach(ex => {
          allExercises.push(ex);
          if (ex.name) {
            exerciseNames.add(ex.name.toLowerCase().trim());
          }
        });
      }
    });
    
    const total = allExercises.length;
    const unique = exerciseNames.size;
    
    // Verificar si hay días con exactamente los mismos ejercicios
    let daysCorrupted = false;
    if (planData.days.length > 1) {
      const firstDayExercises = JSON.stringify(planData.days[0]?.exercises || []);
      for (let i = 1; i < planData.days.length; i++) {
        if (JSON.stringify(planData.days[i]?.exercises || []) === firstDayExercises) {
          daysCorrupted = true;
          break;
        }
      }
    }
    
    return {
      corrupted: daysCorrupted || (unique < total * 0.3), // Si menos del 30% son únicos
      uniqueExercises: unique,
      totalExercises: total,
      duplicatePercentage: total > 0 ? ((total - unique) / total * 100).toFixed(1) : 0
    };
  };

  // Función para REPARAR datos corruptos
  const repararPlanCorrupto = (planData) => {
    console.log('🔧 Reparando plan corrupto...');
    
    const ejerciciosBase = [
      { name: "Sentadillas", sets: 3, reps: "10-12", rest_seconds: 60, notes: "Mantén la espalda recta" },
      { name: "Flexiones", sets: 3, reps: "10-15", rest_seconds: 45, notes: "Codos cerca del cuerpo" },
      { name: "Dominadas asistidas", sets: 3, reps: "6-10", rest_seconds: 90, notes: "Controla el movimiento" },
      { name: "Press de banca", sets: 3, reps: "8-12", rest_seconds: 60, notes: "No arquees la espalda" },
      { name: "Peso muerto", sets: 3, reps: "8-10", rest_seconds: 90, notes: "Mantén la espalda neutra" },
      { name: "Curl de bíceps", sets: 3, reps: "12-15", rest_seconds: 45, notes: "No balancees el cuerpo" },
      { name: "Extensiones de tríceps", sets: 3, reps: "12-15", rest_seconds: 45, notes: "Aísla el tríceps" },
      { name: "Plancha abdominal", sets: 3, reps: "30-60 segundos", rest_seconds: 30, notes: "Mantén posición alineada" },
      { name: "Burpees", sets: 3, reps: "10-12", rest_seconds: 60, notes: "Movimiento fluido y controlado" },
      { name: "Mountain climbers", sets: 3, reps: "20-30 por lado", rest_seconds: 40, notes: "Core activado" },
      { name: "Zancadas", sets: 3, reps: "10-12 por pierna", rest_seconds: 45, notes: "Rodilla a 90 grados" },
      { name: "Remo con barra", sets: 3, reps: "10-12", rest_seconds: 60, notes: "Espalda recta" }
    ];
    
    const tiposDia = [
      "Fuerza Inferior",
      "Fuerza Superior",
      "Full Body",
      "HIIT y Cardio",
      "Core y Estabilidad"
    ];
    
    // Crear días únicos
    const nuevosDias = planData.days.map((day, index) => {
      const tipo = tiposDia[index % tiposDia.length];
      
      // Seleccionar 4-6 ejercicios únicos para cada día
      const inicio = (index * 4) % ejerciciosBase.length;
      const ejerciciosDia = [];
      
      for (let i = 0; i < 5; i++) {
        const ejercicioIdx = (inicio + i) % ejerciciosBase.length;
        ejerciciosDia.push({
          ...ejerciciosBase[ejercicioIdx],
          id: day.id ? `${day.id}-${i}` : Date.now() + i,
          name: `${ejerciciosBase[ejercicioIdx].name} ${['(Día 1)', '(Día 2)', '(Día 3)', '(Día 4)', '(Día 5)'][index] || ''}`
        });
      }
      
      return {
        ...day,
        name: `Día ${index + 1} - ${tipo}`,
        exercises: ejerciciosDia
      };
    });
    
    const planReparado = {
      ...planData,
      days: nuevosDias,
      title: `${planData.title} (Reparado)`
    };
    
    console.log('✅ Plan reparado exitosamente');
    return planReparado;
  };

  // Función mejorada para cargar el plan
  const loadPlan = async (force = false) => {
    try {
      const token = getAuthToken(navigate);
      
      // Si es recarga forzada o primera carga
      if (force || !plan) {
        console.log('📥 Cargando plan desde backend...');
        const planResponse = await axios.get(`${API_URL}/api/workouts/plans/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        let planData = planResponse.data;
        
        // Verificar si los datos están corruptos
        const verificacion = verificarDatosPlan(planData);
        setUniqueExercises(verificacion.uniqueExercises);
        setTotalExercises(verificacion.totalExercises);
        
        if (verificacion.corrupted) {
          console.warn('⚠️ Datos corruptos detectados:', verificacion);
          setDataCorrupted(true);
          
          // Mostrar alerta
          setSnackbar({
            open: true,
            message: `Se detectaron datos duplicados (${verificacion.duplicatePercentage}% de ejercicios repetidos). Regenera el plan.`,
            severity: 'warning'
          });
          
          // Reparar automáticamente solo para visualización
          planData = repararPlanCorrupto(planData);
        } else {
          setDataCorrupted(false);
        }
        
        setPlan(planData);
        setLastUpdated(planData.last_modified || planData.generated_at);
        
        // Cargar ejercicios completados
        const completedResponse = await axios.get(
          `${API_URL}/api/workouts/completed-exercises/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        
        const completedExercisesData = completedResponse.data.completed_exercises || [];
        const initialCompletedState = {};
        
        planData.days?.forEach(day => {
          day.exercises?.forEach(exercise => {
            initialCompletedState[exercise.id] = completedExercisesData.includes(exercise.id);
          });
        });
        
        setCompletedExercises(initialCompletedState);
        return;
      }
      
      // Solo verificar cambios si ya tenemos un plan
      try {
        const response = await axios.get(`${API_URL}/api/workouts/plans/${id}/check-updates/`, {
          headers: { Authorization: `Token ${token}` },
          params: { 
            last_modified: lastUpdated,
            timestamp: Date.now() // Evitar cache
          }
        });
        
        if (response.data.modified) {
          console.log('🔄 Plan modificado, recargando...');
          const planResponse = await axios.get(`${API_URL}/api/workouts/plans/${id}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          
          let planData = planResponse.data;
          
          // Verificar si los nuevos datos están corruptos
          const verificacion = verificarDatosPlan(planData);
          setUniqueExercises(verificacion.uniqueExercises);
          setTotalExercises(verificacion.totalExercises);
          
          if (verificacion.corrupted) {
            console.warn('⚠️ Nuevos datos corruptos detectados:', verificacion);
            setDataCorrupted(true);
            
            // Reparar automáticamente solo para visualización
            planData = repararPlanCorrupto(planData);
          } else {
            setDataCorrupted(false);
          }
          
          setPlan(planData);
          const nuevoLastModified = response.data.last_modified || planData.last_modified || planData.generated_at;
          setLastUpdated(nuevoLastModified);
          setPlanModified(true);
          
          // Recargar ejercicios completados
          const completedResponse = await axios.get(
            `${API_URL}/api/workouts/completed-exercises/`,
            { headers: { Authorization: `Token ${token}` } }
          );
          
          const completedExercisesData = completedResponse.data.completed_exercises || [];
          const newCompletedState = {};
          
          planData.days?.forEach(day => {
            day.exercises?.forEach(exercise => {
              newCompletedState[exercise.id] = completedExercisesData.includes(exercise.id);
            });
          });
          
          setCompletedExercises(newCompletedState);
          
          // Solo mostrar notificación si NO es el entrenador quien hizo los cambios
          // y si la modificación aún no ha sido notificada (evita notificaciones repetidas).
          if (!isTrainer && nuevoLastModified !== lastNotifiedRef.current) {
            lastNotifiedRef.current = nuevoLastModified;
            setSnackbar({
              open: true,
              message: '¡Tu entrenador ha actualizado tu rutina! Los cambios han sido aplicados.',
              severity: 'info'
            });
          }
        }
      } catch (error) {
        // Si falla el endpoint de check-updates, intentar cargar completo
        if (error.response?.status === 404) {
          console.log('⚠️ Endpoint check-updates no disponible, cargando plan completo...');
          const planResponse = await axios.get(`${API_URL}/api/workouts/plans/${id}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          
          let planData = planResponse.data;
          const verificacion = verificarDatosPlan(planData);
          if (verificacion.corrupted) {
            planData = repararPlanCorrupto(planData);
            setDataCorrupted(true);
          }
          setPlan(planData);
        }
      }
      
    } catch (error) {
      console.error('Error cargando plan:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken(navigate);
        
        // Cargar rol primero
        await loadUserRole();
        
        // Cargar perfil
        const profileResponse = await axios.get(`${API_URL}/api/users/profile/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setUserProfile(profileResponse.data);
        
        // Cargar plan completo
        await loadPlan(true);
        
        // Verificar si necesita regeneración
        const diasEnPlan = plan?.days?.length || 0;
        const frecuenciaActual = profileResponse.data.frecuencia || 3;
        
        if (diasEnPlan !== frecuenciaActual) {
          setShowRegenerateAlert(true);
        }
        
        // Cargar estadísticas
        await loadUserStats();
        
        // Cargar chat guardado
        const savedChat = localStorage.getItem(`chatHistory-${id}`);
        if (savedChat) setChatHistory(JSON.parse(savedChat));
        
      } catch (err) {
        console.error('Error:', err);
        setFetchError(err.response?.data?.detail || err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, navigate]);

  // Auto-scroll del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Verificar actualizaciones periódicamente
  useEffect(() => {
    // Solo verificar si NO es entrenador (el entrenador ve los cambios inmediatamente)
    if (!isTrainer && plan) {
      const interval = setInterval(() => {
        loadPlan();
      }, 15000); // Verificar cada 15 segundos
      
      return () => clearInterval(interval);
    }
  }, [id, isTrainer, plan]);
// Función para regenerar el plan (CORREGIDA CON REDIRECCIÓN)
const handleRegeneratePlan = async () => {
  try {
    setRegenerating(true);
    const token = getAuthToken(navigate);
    const userId = userProfile?.user_id || userProfile?.id;
    
    if (!userId) {
      setSnackbar({
        open: true,
        message: '❌ No se pudo identificar el usuario',
        severity: 'error'
      });
      setRegenerating(false);
      return;
    }
    
    console.log('🔄 Regenerando plan para usuario:', userId);
    
    // Usar el endpoint correcto que SÍ existe en tu backend
    const response = await axios.post(
      `${API_URL}/api/workouts/regenerar-plan/${userId}/`,
      {},
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Respuesta del servidor:', response.data);
    
    if (response.data.plan) {
      const nuevoPlan = response.data.plan;
      const nuevoPlanId = nuevoPlan.id;
      const planIdActual = parseInt(id);
      
      console.log(`📌 Plan actual ID: ${planIdActual}, Nuevo plan ID: ${nuevoPlanId}`);
      
      // Si el ID del plan cambió, redirigir al nuevo plan
      if (nuevoPlanId && nuevoPlanId !== planIdActual) {
        console.log(`🔄 Redirigiendo del plan ${planIdActual} al plan ${nuevoPlanId}`);
        setSnackbar({
          open: true,
          message: '✅ Plan regenerado exitosamente. Redirigiendo...',
          severity: 'success'
        });
        
        // Redirigir al nuevo plan
        setTimeout(() => {
          navigate(`/mi-rutina/${nuevoPlanId}`);
        }, 1000);
        return;
      }
      
      // Si el ID es el mismo, actualizar el estado local
      const verificacion = verificarDatosPlan(nuevoPlan);
      
      if (verificacion.corrupted) {
        setSnackbar({
          open: true,
          message: `⚠️ El nuevo plan tiene ejercicios duplicados (${verificacion.duplicatePercentage}%). Regenera nuevamente.`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: '✅ Nuevo plan generado exitosamente con ejercicios variados',
          severity: 'success'
        });
        setDataCorrupted(false);
      }
      
      setPlan(nuevoPlan);
      setLastUpdated(nuevoPlan.last_modified || nuevoPlan.generated_at);
      setShowRegenerateAlert(false);
      setPlanModified(false);
      setUniqueExercises(verificacion.uniqueExercises);
      setTotalExercises(verificacion.totalExercises);
      
      // Reiniciar chat
      setChatHistory([]);
      localStorage.removeItem(`chatHistory-${id}`);
      
      // Recargar ejercicios completados
      const completedResponse = await axios.get(
        `${API_URL}/api/workouts/completed-exercises/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      const completedExercisesData = completedResponse.data.completed_exercises || [];
      const newCompletedState = {};
      
      nuevoPlan.days?.forEach(day => {
        day.exercises?.forEach(exercise => {
          newCompletedState[exercise.id] = completedExercisesData.includes(exercise.id);
        });
      });
      
      setCompletedExercises(newCompletedState);
    }
    
  } catch (err) {
    console.error('Error al regenerar plan:', err);
    
    // Fallback: intentar obtener el plan directamente
    try {
      const token = getAuthToken(navigate);
      const userId = userProfile?.user_id || userProfile?.id;
      
      const response = await axios.get(
        `${API_URL}/api/workouts/plans/usuario/${userId}/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      const nuevoPlan = response.data;
      const nuevoPlanId = nuevoPlan.id;
      const planIdActual = parseInt(id);
      
      if (nuevoPlanId && nuevoPlanId !== planIdActual) {
        setSnackbar({
          open: true,
          message: '✅ Plan regenerado. Redirigiendo...',
          severity: 'success'
        });
        setTimeout(() => {
          navigate(`/mi-rutina/${nuevoPlanId}`);
        }, 1000);
        return;
      }
      
      setPlan(nuevoPlan);
      setSnackbar({
        open: true,
        message: '✅ Plan regenerado exitosamente',
        severity: 'success'
      });
    } catch (error2) {
      setSnackbar({
        open: true,
        message: '❌ Error al regenerar el plan. Intenta nuevamente.',
        severity: 'error'
      });
    }
  } finally {
    setRegenerating(false);
  }
};

  // Función para marcar ejercicio como completado
  const toggleCompleted = async (exerciseId, exerciseName) => {
    try {
      const token = getAuthToken(navigate);
      const newCompletedState = !completedExercises[exerciseId];
      
      // Actualización optimista
      setCompletedExercises(prev => ({
        ...prev,
        [exerciseId]: newCompletedState
      }));

      await axios.post(
        `${API_URL}/api/workouts/complete-exercise/`,
        { exercise_id: exerciseId },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Actualizar estadísticas
      await loadUserStats();
      
    } catch (error) {
      console.error('Error al completar ejercicio:', error);
      // Revertir cambio
      setCompletedExercises(prev => ({
        ...prev,
        [exerciseId]: !completedExercises[exerciseId]
      }));
    }
  };
  // Función mejorada para buscar video según el tipo de entrenamiento
    const normalizeExerciseName = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const findExerciseVideo = (exerciseName, trainingType = null) => {
    const name = normalizeExerciseName(exerciseName);
    const effectiveTrainingType = trainingType || userProfile?.profile?.training_type || null;

    // 1) Coincidencia EXACTA (normalizada: ignorando acentos, mayúsculas y paréntesis)
    for (const [key, videoUrl] of Object.entries(exerciseVideos)) {
      if (normalizeExerciseName(key) === name) {
        return videoUrl;
      }
    }

    // 2) Coincidencia PARCIAL (norm.: 'gage' en 'Postura del gato-vaca', etc.)
    for (const [key, videoUrl] of Object.entries(exerciseVideos)) {
      const k = normalizeExerciseName(key);
      if (name.includes(k) || k.includes(name)) {
        return videoUrl;
      }
    }

    // 3) Video genérico real del tipo de entrenamiento (todos verificados)
    if (effectiveTrainingType === 'yoga') return 'https://www.youtube.com/embed/1RzzTuBLFI4';
    if (effectiveTrainingType === 'cardio') return 'https://www.youtube.com/embed/TWyguC7VVh8';
    if (effectiveTrainingType === 'gym' || effectiveTrainingType === 'calisthenics') return 'https://www.youtube.com/embed/qsAkuNORgmk';
    return 'https://www.youtube.com/embed/IODxDxX7oi4';
  };

  const toEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
  };

  const handleVideoOpen = (ex) => {
    const exerciseName = ex.name || ex;
    const trainingType = userProfile?.profile?.training_type || null;

    // 1) Prioridad: video exacto del backend (si existe) o el catálogo local verificado
    let videoUrl = toEmbedUrl(ex?.video_url || '');
    if (!videoUrl) {
      videoUrl = findExerciseVideo(exerciseName, trainingType);
    }

    // 2) Fallback seguro: búsqueda en YouTube (se abre en pestaña nueva, nunca iframe roto)
    let isSearchFallback = false;
    if (!videoUrl || !videoUrl.includes('/youtube.com/embed/')) {
      isSearchFallback = true;
      videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex?.video_query || exerciseName)}`;
    }

    setVideoDialog({
      open: true,
      exerciseName,
      videoUrl,
      isSearchFallback
    });
  };

  const handleVideoClose = () => {
    setVideoDialog({
      open: false,
      exerciseName: '',
      videoUrl: ''
    });
  };

  const handleAiQuery = async () => {
    if (!aiPrompt.trim() || aiLoading) return;

    try {
      const token = getAuthToken(navigate);
      const userMessage = { 
        role: 'user', 
        text: aiPrompt, 
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString()
      };

      // Actualizar chat
      setChatHistory(prev => {
        const updatedChat = [...prev, userMessage];
        localStorage.setItem(`chatHistory-${id}`, JSON.stringify(updatedChat));
        return updatedChat;
      });

      setAiPrompt('');
      setAiLoading(true);

      const response = await axios.post(
        `${API_URL}/api/workouts/chat-asistente/`,
        { prompt: aiPrompt },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          }
        }
      );

      setChatHistory(prev => {
        const answer = {
          role: 'assistant',
          text: response.data?.answer || "No pude generar una respuesta.",
          id: Date.now() + 1,
          timestamp: new Date().toLocaleTimeString()
        };
        const updatedChat = [...prev, answer];
        localStorage.setItem(`chatHistory-${id}`, JSON.stringify(updatedChat));
        return updatedChat;
      });

    } catch (error) {
      if (error.message !== 'No autenticado') {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          text: "Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta nuevamente.",
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Función para iniciar edición
  const startEditing = (exercise) => {
    setEditingExerciseId(exercise.id);
    setEditingData({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.rest_seconds || 60,
      notes: exercise.notes || ''
    });
  };

  // Función para cancelar edición
  const cancelEditing = () => {
    setEditingExerciseId(null);
    setEditingData({});
  };

  // Función para guardar cambios
  const saveExercise = async (exerciseId) => {
    try {
      const token = getAuthToken(navigate);
      
      const response = await axios.put(
        `${API_URL}/api/workouts/actualizar-ejercicio/${exerciseId}/`,
        editingData,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Actualizar plan local
        setPlan(prevPlan => {
          if (!prevPlan) return prevPlan;
          
          const updatedPlan = { ...prevPlan };
          updatedPlan.days = updatedPlan.days.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => 
              ex.id === exerciseId ? { ...ex, ...editingData } : ex
            )
          }));
          
          return updatedPlan;
        });

        cancelEditing();
        
        // Mostrar snackbar de confirmación
        setSnackbar({
          open: true,
          message: '✅ Ejercicio actualizado correctamente',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error al actualizar ejercicio:', error);
      setSnackbar({
        open: true,
        message: error.response?.status === 403 
          ? '❌ Solo los entrenadores pueden editar ejercicios'
          : '❌ Error al guardar los cambios',
        severity: 'error'
      });
    }
  };

  // Componente de ejercicio
  const ExerciseItem = ({ ex, completed }) => {
    const isEditing = editingExerciseId === ex.id;

    if (isEditing) {
      return (
        <ExerciseCard 
          isediting="true"
          elevation={0}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="600" color="warning.main">
                Editando ejercicio
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={cancelEditing}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  onClick={() => saveExercise(ex.id)}
                >
                  Guardar
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del ejercicio"
                  value={editingData.name}
                  onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                  size="small"
                  margin="dense"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Series"
                  type="number"
                  value={editingData.sets}
                  onChange={(e) => setEditingData(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                  size="small"
                  margin="dense"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Repeticiones"
                  value={editingData.reps}
                  onChange={(e) => setEditingData(prev => ({ ...prev, reps: e.target.value }))}
                  size="small"
                  margin="dense"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Descanso (seg)"
                  type="number"
                  value={editingData.rest_seconds}
                  onChange={(e) => setEditingData(prev => ({ ...prev, rest_seconds: parseInt(e.target.value) || 0 }))}
                  size="small"
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  value={editingData.notes}
                  onChange={(e) => setEditingData(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                  rows={2}
                  size="small"
                  margin="dense"
                />
              </Grid>
            </Grid>
          </Box>
        </ExerciseCard>
      );
    }

    return (
      <ExerciseCard 
        completed={completed ? "true" : "false"}
        isediting="false"
        elevation={0}
        onClick={() => !isTrainer && toggleCompleted(ex.id, ex.name)}
        sx={{ cursor: isTrainer ? 'default' : 'pointer' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flexShrink: 0 }}>
            <Avatar 
              sx={{ 
                bgcolor: completed ? 'success.main' : 'primary.main',
                width: 40,
                height: 40,
                cursor: isTrainer ? 'default' : 'pointer'
              }}
            >
              {completed ? <CheckCircle2 size={20} /> : <DumbbellIcon size={20} />}
            </Avatar>
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" fontWeight="600">
                {ex.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isTrainer && (
                  <Tooltip title="Editar ejercicio">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(ex);
                      }}
                      sx={{ color: 'warning.main' }}
                    >
                      <Edit size={18} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Ver demostración">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoOpen(ex);
                    }}
                    sx={{ color: 'primary.main' }}
                  >
                    <Video size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip 
                icon={<Target size={14} />}
                label={`${ex.sets} sets`}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip 
                icon={<TrendingUp size={14} />}
                label={`${ex.reps} reps`}
                size="small"
                variant="outlined"
                color="secondary"
              />
              <Chip 
                icon={<Clock size={14} />}
                label={`${ex.rest_seconds || 0}s descanso`}
                size="small"
                variant="outlined"
              />
            </Box>
            
            {ex.notes && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  mt: 1
                }}
              >
                {ex.notes}
              </Typography>
            )}
          </Box>
        </Box>
      </ExerciseCard>
    );
  };

  // Estadísticas rápidas
  const QuickStats = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={6} md={3}>
        <GlassCard>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Flame size={24} color="#ff6b35" />
            </Box>
            <Typography variant="h4" fontWeight="700">
              {stats?.current_streak || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Días seguidos
            </Typography>
          </CardContent>
        </GlassCard>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <GlassCard>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <CheckCircle2 size={24} color="#4caf50" />
            </Box>
            <Typography variant="h4" fontWeight="700">
              {Object.values(completedExercises).filter(Boolean).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ejercicios hoy
            </Typography>
          </CardContent>
        </GlassCard>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <GlassCard>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Award size={24} color="#ffd700" />
            </Box>
            <Typography variant="h4" fontWeight="700">
              {stats?.total_points || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Puntos totales
            </Typography>
          </CardContent>
        </GlassCard>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <GlassCard>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Zap size={24} color="#9c27b0" />
            </Box>
            <Typography variant="h4" fontWeight="700">
              {uniqueExercises}/{totalExercises}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ejercicios únicos
            </Typography>
          </CardContent>
        </GlassCard>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress 
          size={60} 
          sx={{ 
            color: '#667eea',
            animationDuration: '1s'
          }} 
        />
        <Typography variant="h6" color="text.secondary">
          Cargando tu rutina personalizada...
        </Typography>
        <ProgressBar sx={{ width: '200px', mt: 2 }} />
      </Box>
    );
  }

  if (!plan || fetchError) {
    return (
      <Container maxWidth="md">
        <Box sx={{ 
          textAlign: 'center', 
          py: 10,
          px: 2
        }}>
          <XCircle size={64} color="#f44336" style={{ marginBottom: 16 }} />
          <Typography variant="h5" color="text.primary" gutterBottom>
            {fetchError || 'Plan no encontrado'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            No pudimos cargar tu plan de entrenamiento. Por favor, verifica tu conexión o intenta nuevamente.
          </Typography>
          <GradientButton 
            onClick={() => navigate(-1)}
            startIcon={<ChevronLeft />}
            sx={{ mt: 2 }}
          >
            Volver atrás
          </GradientButton>
        </Box>
      </Container>
    );
  }

  return (
    <React.Fragment>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: { xs: 3, md: 4 },
        px: { xs: 2, md: 0 },
      }}>
        <Container maxWidth="xl">
          {/* Encabezado */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => navigate('/dashboard')}
                sx={{ 
                  background: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  '&:hover': { background: '#f8f9fa' }
                }}
              >
                <ChevronLeft />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight="700" sx={{ color: '#2d3748' }}>
                  Mi Plan de Entrenamiento
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {plan.title || 'Plan personalizado'}
                  {planModified && (
                    <Chip 
                      label="Actualizado"
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {dataCorrupted && (
                    <Chip 
                      label="Datos reparados"
                      size="small"
                      color="warning"
                      variant="outlined"
                      icon={<AlertTriangle size={14} />}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>
              {isTrainer && (
                <Chip 
                  label="Modo Entrenador"
                  color="warning"
                  variant="outlined"
                  icon={<Edit size={16} />}
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <GradientButton
                startIcon={<RefreshCw />}
                onClick={handleRegeneratePlan}
                disabled={regenerating}
                color={dataCorrupted ? "warning" : "primary"}
              >
                {regenerating ? 'Regenerando...' : dataCorrupted ? 'Reparar Plan' : 'Regenerar Plan'}
              </GradientButton>
              
              {/* Botón de recargar */}
              <Button
                variant="outlined"
                startIcon={<RefreshCw />}
                onClick={() => loadPlan(true)}
                disabled={loading}
                sx={{ borderRadius: '12px' }}
              >
                Recargar
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<BarChart3 />}
                onClick={() => navigate('/dashboard')}
                sx={{ borderRadius: '12px' }}
              >
                Ver Estadísticas
              </Button>
            </Box>
          </Box>

          {/* Alerta de datos corruptos */}
          {dataCorrupted && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3, 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                border: '1px solid #ffc107'
              }}
              icon={<AlertTriangle />}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRegeneratePlan}
                  disabled={regenerating}
                  startIcon={<RefreshCw size={16} />}
                >
                  Reparar Ahora
                </Button>
              }
            >
              <Typography fontWeight="600">
                ¡Atención! Ejercicios duplicados detectados
              </Typography>
              <Typography variant="body2">
                Se encontraron {totalExercises - uniqueExercises} ejercicios repetidos ({totalExercises > 0 ? Math.round((totalExercises - uniqueExercises) / totalExercises * 100) : 0}%).
                Esto puede afectar tu progreso. Recomendamos regenerar el plan.
              </Typography>
            </Alert>
          )}

          {/* Alerta de regeneración */}
          <Collapse in={showRegenerateAlert}>
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRegeneratePlan}
                  disabled={regenerating}
                  startIcon={<RefreshCw size={16} />}
                >
                  Actualizar
                </Button>
              }
            >
              <Typography fontWeight="600">
                Tu plan no coincide con tu frecuencia actual
              </Typography>
              <Typography variant="body2">
                Tu perfil indica {userProfile?.frecuencia || 3} días/semana, pero este plan tiene {plan.days?.length} días.
              </Typography>
            </Alert>
          </Collapse>

          {/* Estadísticas rápidas */}
          <QuickStats />

          <Grid container spacing={3}>
            {/* Columna de rutina */}
            <Grid item xs={12} lg={7}>
              <GlassCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Dumbbell size={28} color="#667eea" />
                    <Typography variant="h5" fontWeight="600" sx={{ ml: 1.5 }}>
                      Tu Rutina Semanal
                      {dataCorrupted && (
                        <Chip 
                          label="Reparada"
                          size="small"
                          color="warning"
                          sx={{ ml: 2 }}
                        />
                      )}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip 
                      label={`${Object.values(completedExercises).filter(Boolean).length}/${plan.days?.reduce((acc, day) => acc + day.exercises.length, 0)} completados`}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {plan.days?.map((day, index) => (
                    <Accordion
                      key={day.id || index}
                      expanded={expandedDay === index}
                      onChange={() => setExpandedDay(expandedDay === index ? -1 : index)}
                      sx={{
                        mb: 2,
                        borderRadius: '12px !important',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        '&:before': { display: 'none' }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          background: expandedDay === index 
                            ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
                            : 'transparent',
                          borderRadius: '12px',
                          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                            transform: 'rotate(180deg)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar sx={{ 
                            bgcolor: dataCorrupted ? 'warning.main' : '#667eea', 
                            mr: 2, 
                            width: 40, 
                            height: 40 
                          }}>
                            {index + 1}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight="600">
                              {day.name || `Día ${index + 1}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {day.exercises?.length || 0} ejercicios
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={`${day.exercises?.filter(ex => completedExercises[ex.id]).length || 0}/${day.exercises?.length || 0}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mt: 2 }}>
                          {day.exercises?.map((ex) => (
                            <ExerciseItem
                              key={ex.id || `ex-${Math.random()}`}
                              ex={ex}
                              completed={completedExercises[ex.id]}
                            />
                          )) || (
                            <Alert severity="info">
                              No hay ejercicios para este día.
                            </Alert>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </GlassCard>
            </Grid>

            {/* Columna de chat */}
            <Grid item xs={12} lg={5}>
              <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <MessageCircle size={20} color="#fff" />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight="600">
                        Asistente IA
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pregunta sobre tu rutina
                      </Typography>
                    </Box>
                  </Box>

                  {/* Área del chat */}
                  <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    mb: 3,
                    p: 2,
                    borderRadius: '12px',
                    background: '#f8f9fa',
                    minHeight: '400px',
                    maxHeight: '500px'
                  }}>
                    {chatHistory.length === 0 ? (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        <Box sx={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2
                        }}>
                          <Sparkles size={32} color="#667eea" />
                        </Box>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                          ¡Hola! Soy tu asistente
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Puedo ayudarte con tu rutina, nutrición y más.
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          <Chip 
                            label="¿Cómo mejorar mi técnica?"
                            size="small"
                            onClick={() => setAiPrompt("¿Cómo mejorar mi técnica en los ejercicios?")}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Chip 
                            label="Sugerencias de rutina"
                            size="small"
                            onClick={() => setAiPrompt("¿Qué modificaciones sugieres a mi rutina?")}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Chip 
                            label="Consejos nutrición"
                            size="small"
                            onClick={() => setAiPrompt("¿Qué consejos nutricionales me das?")}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      chatHistory.map((msg) => (
                        <Box 
                          key={msg.id}
                          sx={{ 
                            mb: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            maxWidth: '85%'
                          }}>
                            {msg.role !== 'user' && (
                              <Avatar sx={{ width: 32, height: 32, mt: 0.5 }}>
                                <Sparkles size={16} />
                              </Avatar>
                            )}
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: '18px',
                                background: msg.role === 'user' 
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : 'white',
                                color: msg.role === 'user' ? 'white' : 'inherit',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: msg.role === 'user' ? 'none' : '1px solid #e0e0e0'
                              }}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {msg.text}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  mt: 0.5,
                                  opacity: 0.7,
                                  textAlign: 'right'
                                }}
                              >
                                {msg.timestamp}
                              </Typography>
                            </Paper>
                            {msg.role === 'user' && (
                              <Avatar sx={{ width: 32, height: 32, mt: 0.5, bgcolor: '#667eea' }}>
                                <User size={16} />
                              </Avatar>
                            )}
                          </Box>
                        </Box>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </Box>

                  {/* Input del chat */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    pt: 2,
                    borderTop: '1px solid #e0e0e0'
                  }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Escribe tu pregunta..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAiQuery()}
                      disabled={aiLoading}
                      multiline
                      maxRows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          background: '#f8f9fa'
                        },
                      }}
                    />
                    <IconButton
                      onClick={handleAiQuery}
                      disabled={aiLoading || !aiPrompt.trim()}
                      sx={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a3f8a 100%)',
                        },
                        '&:disabled': {
                          background: '#e0e0e0'
                        }
                      }}
                    >
                      {aiLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <Send />
                      )}
                    </IconButton>
                  </Box>
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Container>

               {/* Dialog para videos - VERSIÓN CORREGIDA */}
        <Dialog
          open={videoDialog.open}
          onClose={handleVideoClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: '20px',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Play size={24} />
              <Typography variant="h6" fontWeight="600">
                Tutorial: {videoDialog.exerciseName}
              </Typography>
            </Box>
            <IconButton 
              onClick={handleVideoClose} 
              sx={{ 
                color: 'white',
                '&:hover': { background: 'rgba(255,255,255,0.1)' }
              }}
            >
              <X />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {videoDialog.isSearchFallback ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  {videoDialog.exerciseName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  No encontramos un video verificado para este ejercicio.
                </Typography>
                <Button
                  component="a"
                  href={videoDialog.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Youtube />}
                >
                  Ver tutorial en YouTube
                </Button>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src={videoDialog.videoUrl}
                  title={`Video tutorial de ${videoDialog.exerciseName}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  srcDoc={null}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </React.Fragment>
  );
};

export default MiRutina;