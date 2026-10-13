import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Lock, Dumbbell, Loader2, AlertCircle, ArrowRight, CheckCircle,
  ShieldCheck, KeyRound, Eye, EyeOff, ArrowLeft,
} from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";

const PasswordResetPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const resetAlerts = () => {
    setError("");
    setInfo("");
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    resetAlerts();
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/users/password-reset/`,
        { email: email.trim() },
        { headers: { "Content-Type": "application/json" } }
      );
      if (data.sent === false) {
        setError(
          data.message || "No se pudo enviar el correo. Inténtalo de nuevo."
        );
        return;
      }
      setInfo(data.debug_code ? "" : data.message || "Si el correo existe, recibirás un código.");
      if (data.debug_code) {
        setInfo(`Código (modo desarrollo): ${data.debug_code}`);
      }
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo enviar el código. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    resetAlerts();
    if (!code.trim()) {
      setError("Ingresa el código de 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/users/password-reset/verify/`,
        { email: email.trim(), code: code.trim() },
        { headers: { "Content-Type": "application/json" } }
      );
      setInfo("Código verificado. Ahora crea tu nueva contraseña.");
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.error || "Código inválido o expirado."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    resetAlerts();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/users/password-reset/confirm/`,
        { email: email.trim(), code: code.trim(), new_password: password },
        { headers: { "Content-Type": "application/json" } }
      );
      setInfo("¡Contraseña actualizada! Redirigiendo al inicio de sesión...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error || "No se pudo actualizar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  const stepIcon = {
    1: <Mail size={28} className="text-white" />,
    2: <KeyRound size={28} className="text-white" />,
    3: <ShieldCheck size={28} className="text-white" />,
  };

  const stepTitle = {
    1: "Recuperar contraseña",
    2: "Verifica el código",
    3: "Nueva contraseña",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 p-8 text-center relative">
          <div className="flex justify-center mb-3">{stepIcon[step]}</div>
          <h1 className="text-white text-2xl font-extrabold">{stepTitle[step]}</h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? "w-10 bg-white" : "w-6 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Dumbbell className="text-emerald-600" size={22} />
            <span className="font-extrabold text-slate-800 text-lg">AdaptaFit</span>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
              <CheckCircle size={18} className="mt-0.5 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {/* PASO 1 */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <p className="text-slate-500 text-sm text-center">
                Ingresa el correo de tu cuenta y te enviaremos un código de
                recuperación.
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Correo electrónico
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-emerald-300 disabled:to-emerald-300 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Enviando...
                  </>
                ) : (
                  <>
                    Enviar código <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-slate-500 text-sm text-center">
                Ingresa el código de 6 dígitos enviado a{" "}
                <span className="font-semibold text-slate-700">{email}</span>.
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Código de verificación
                </label>
                <div className="relative mt-1.5">
                  <KeyRound
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 tracking-[0.5em] text-center font-bold transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-emerald-300 disabled:to-emerald-300 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Verificando...
                  </>
                ) : (
                  <>
                    Verificar código <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  resetAlerts();
                  setStep(1);
                }}
                className="w-full text-sm text-slate-500 hover:text-emerald-600 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} /> Usar otro correo
              </button>
            </form>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-slate-500 text-sm text-center">
                Crea tu nueva contraseña (mínimo 6 caracteres).
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nueva contraseña
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Confirmar contraseña
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-emerald-300 disabled:to-emerald-300 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Guardando...
                  </>
                ) : (
                  <>
                    Restablecer contraseña <CheckCircle size={18} />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Volver al login */}
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
            >
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PasswordResetPage;
