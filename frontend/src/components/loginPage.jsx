import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Dumbbell,
  Loader2,
  AlertCircle
} from "lucide-react";
import axios from 'axios';

const LoginPage = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState("usuario");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const loginUrl = 'http://127.0.0.1:8000/api/users/login/';
    console.log("Enviando login a:", loginUrl);
    
    // IMPORTANTE: El serializador AuthTokenSerializer espera 'email', no 'username'
    const response = await axios.post(
      loginUrl,
      {
        email: email,  // ← CORRECCIÓN: Usar 'email' no 'username'
        password: password,
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Login exitoso:", response.data);
    
    // IMPORTANTE: Guardar en localStorage con los nombres que App.jsx espera
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userRole', response.data.tipo_usuario);
    
    // También guardar datos completos por si acaso
    localStorage.setItem('userData', JSON.stringify({
      id: response.data.user_id,
      email: response.data.email,
      nombre: response.data.nombre,
      tipo_usuario: response.data.tipo_usuario
    }));
    
    // CORRECCIÓN: Llamar a onLogin con SOLO token y role (no objeto completo)
    if (onLogin && typeof onLogin === 'function') {
      console.log("Llamando a onLogin con:", response.data.token, response.data.tipo_usuario);
      onLogin(response.data.token, response.data.tipo_usuario);
    }

  } catch (error) {
    console.error("Error completo en login:", error);
    console.error("Respuesta del error:", error.response?.data);
    
    if (error.response) {
      if (error.response.status === 404) {
        setError("URL de login incorrecta. Verifica la configuración.");
      } else if (error.response.status === 400) {
        // Mostrar mensajes de error específicos del backend
        if (error.response.data.error) {
          setError(error.response.data.error);
        } else if (error.response.data.details) {
          // Mostrar detalles específicos del serializer
          const details = error.response.data.details;
          if (details.email) {
            setError(details.email[0]);
          } else if (details.password) {
            setError(details.password[0]);
          } else if (details.non_field_errors) {
            setError(details.non_field_errors[0]);
          } else {
            setError("Error en credenciales");
          }
        } else if (error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors[0]);
        } else {
          setError("Email o contraseña incorrectos");
        }
      } else {
        setError(`Error del servidor (${error.response.status})`);
      }
    } else if (error.request) {
      setError("No se pudo conectar al servidor. Verifica que esté corriendo.");
    } else {
      setError("Error: " + error.message);
    }
  } finally {
    setLoading(false);
  }
};

  // ... resto del código IGUAL (sin cambios en el JSX)
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* PANEL IZQUIERDO */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-12"
      >
        <img
          src="/login-fitness.png"
          alt="Entrenamiento IA"
          className="rounded-2xl shadow-2xl mb-10 max-w-md"
        />

        <h2 className="text-4xl font-extrabold mb-4">
          AdaptaFit
        </h2>

        <p className="text-center text-slate-300 max-w-md text-lg">
          Entrenamiento inteligente, personalizado y adaptado a tu progreso
          mediante inteligencia artificial.
        </p>
      </motion.div>

      {/* PANEL DERECHO */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8"
        >
          {/* LOGO */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 text-white p-4 rounded-2xl mb-3 shadow-md">
              <Dumbbell size={30} />
            </div>
            <h1 className="text-2xl font-bold">
              Iniciar sesión
            </h1>
            <p className="text-gray-500 text-sm text-center mt-1">
              Accede a tu cuenta y genera rutinas con IA
            </p>
          </div>

          {/* SELECTOR DE ROL */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRol("usuario")}
              className={`py-2 rounded-lg font-medium transition
                ${rol === "usuario"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 hover:bg-gray-200"}`}
            >
              <User className="inline mr-2" size={16} />
              Usuario
            </button>

            <button
              type="button"
              onClick={() => setRol("entrenador")}
              className={`py-2 rounded-lg font-medium transition
                ${rol === "entrenador"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 hover:bg-gray-200"}`}
            >
              <Dumbbell className="inline mr-2" size={16} />
              Entrenador
            </button>
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* BOTÓN */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold shadow-md transition flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </motion.button>
          </form>

          {/* FOOTER */}
          <div className="text-center mt-6 text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <a
              href="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Crear cuenta
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;