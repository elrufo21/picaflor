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

  const { control, handleSubmit } = form;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (token) {
      const redirectTo =
        (location.state as any)?.from?.pathname ||
        (location.state as any)?.from ||
        "/";
      navigate(redirectTo, { replace: true });
    }
  }, [location.state, navigate, token]);

  const onSubmit = async (values: LoginForm) => {
    const ok = await login({
      username: values.username,
      password: values.password,
    });
    if (ok) {
      toast.success("Bienvenido");
      const redirectTo =
        (location.state as any)?.from?.pathname ||
        (location.state as any)?.from ||
        "/";
      navigate(redirectTo, { replace: true });
    } else {
      toast.error("Credenciales invalidas");
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-blue-900/70" />
        <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-20 -bottom-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-lg overflow-hidden">
        <div className="hidden md:block relative">
          <img
            src="/images/viajes_picaflor.webp"
            alt="Viajes Picaflor"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Ingreso a Picaflor</h1>
              <p className="text-sm text-slate-200/80">
                Usa tus credenciales para continuar
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <TextControlled
              name="username"
              control={control}
              label="Usuario"
              required
              fullWidth
              size="small"
              InputLabelProps={{ className: "text-slate-200" }}
              InputProps={{
                className:
                  "text-white bg-white/10 border border-white/10 rounded-xl",
              }}
            />
            <TextControlled
              name="password"
              control={control}
              label="Contrasena"
              type="password"
              required
              fullWidth
              size="small"
              InputLabelProps={{ className: "text-slate-200" }}
              InputProps={{
                className:
                  "text-white bg-white/10 border border-white/10 rounded-xl",
              }}
            />

            {(error && hydrated) && (
              <div className="text-sm text-red-200 bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-70"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
