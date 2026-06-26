import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { showToast } from "@/components/ui/AppToast";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { clearStoredSession } from "@/shared/auth/session";

const passwordMinRules = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

const PasswordRecovery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token")?.trim() ?? "",
    [location.search],
  );
  const [usuarioOCorreo, setUsuarioOCorreo] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const solicitarRecuperacion = async () => {
    if (!usuarioOCorreo.trim()) {
      showToast({ title: "Error", description: "Ingresa tu usuario o correo", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await apiRequest({
        url: `${API_BASE_URL}/User/recuperar-clave`,
        method: "POST",
        data: { usuarioOCorreo },
      });
      setSent(true);
      showToast({ title: "Listo", description: "Si existe una cuenta, enviaremos el enlace al correo registrado.", type: "success" });
    } catch {
      showToast({ title: "Error", description: "No se pudo solicitar la recuperacion", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const restablecerClave = async () => {
    if (!passwordMinRules.test(nuevaClave)) {
      showToast({ title: "Error", description: "La contraseña debe tener minimo 6 caracteres, una mayuscula y un numero", type: "error" });
      return;
    }

    if (nuevaClave !== confirmarClave) {
      showToast({ title: "Error", description: "Las contraseñas no coinciden", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await apiRequest({
        url: `${API_BASE_URL}/User/restablecer-clave`,
        method: "POST",
        data: { token, nuevaClave },
      });
      clearStoredSession();
      showToast({ title: "Listo", description: "Contraseña actualizada. Inicia sesion nuevamente.", type: "success" });
      navigate("/login", { replace: true });
    } catch {
      showToast({ title: "Error", description: "El enlace vencio o no es valido", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      <div className="relative w-full max-w-md bg-white/[0.04] border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white mb-8">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            {token ? <KeyRound className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {token ? "Nueva contraseña" : "Recuperar contraseña"}
          </h1>
        </div>

        <p className="text-sm text-slate-400 mb-7">
          {token
            ? "Ingresa una nueva contraseña para tu cuenta."
            : "Te enviaremos un enlace al correo registrado."}
        </p>

        {!token ? (
          <div className="space-y-5">
            <input
              value={usuarioOCorreo}
              onChange={(event) => setUsuarioOCorreo(event.target.value)}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm outline-none focus:border-cyan-400"
              placeholder="Usuario o correo"
              autoComplete="username"
            />
            {sent && (
              <div className="text-sm text-cyan-100 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-3">
                Revisa tu bandeja de entrada o spam. El enlace vence en 30 minutos.
              </div>
            )}
            <button
              type="button"
              onClick={solicitarRecuperacion}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <input
              value={nuevaClave}
              onChange={(event) => setNuevaClave(event.target.value)}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm outline-none focus:border-cyan-400"
              placeholder="Nueva contraseña"
              type="password"
              autoComplete="new-password"
              maxLength={50}
            />
            <input
              value={confirmarClave}
              onChange={(event) => setConfirmarClave(event.target.value)}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm outline-none focus:border-cyan-400"
              placeholder="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              maxLength={50}
            />
            <button
              type="button"
              onClick={restablecerClave}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordRecovery;
