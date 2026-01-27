import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

import { TextControlled } from "@/components/ui/inputs";
import { useAuthStore } from "@/store/auth/auth.store";

type LoginForm = {
  username: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, login, loading, error, hydrate, hydrated } = useAuthStore();

  const form = useForm<LoginForm>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { control, handleSubmit, setFocus } = form;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (token) {
      navigate("/fullday", { replace: true });
    }
  }, [navigate, token]);

  const onSubmit = async (values: LoginForm) => {
    const ok = await login({
      username: values.username,
      password: values.password,
    });
    if (ok) {
      toast.success("Bienvenido");
      navigate("/fullday", { replace: true });
    } else {
      toast.error("Credenciales invalidas");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 overflow-hidden">
      {/* Efectos de fondo sutiles */}
      <div className="absolute inset-0">
        <div
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      {/* Patrón de grid sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Panel izquierdo con imagen */}
        <div className="hidden md:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent z-10" />
          <img
            src="/images/viajes_picaflor.png"
            alt="Viajes Picaflor"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Panel derecho con formulario */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LogIn className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Bienvenido
              </h1>
            </div>
            <p className="text-sm text-slate-400 ml-[52px]">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <TextControlled
                name="username"
                control={control}
                label="Usuario"
                size="small"
                inputProps={{
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setFocus("password");
                    }
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#38bdf8",
                    },
                  },
                }}
                InputProps={{
                  sx: {
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "10px",
                    transition: "all 0.2s",

                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.08)",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.15)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#38bdf8",
                      borderWidth: "1px",
                    },
                  },
                }}
              />
            </div>

            <div>
              <TextControlled
                name="password"
                control={control}
                label="Contraseña"
                type="password"
                size="small"
                InputLabelProps={{
                  sx: {
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#38bdf8",
                    },
                  },
                }}
                inputProps={{
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit(onSubmit)();
                    }
                  },
                }}
                InputProps={{
                  sx: {
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "10px",
                    transition: "all 0.2s",

                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.08)",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.15)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#38bdf8",
                      borderWidth: "1px",
                    },
                  },
                }}
              />
            </div>

            {error && hydrated && (
              <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
