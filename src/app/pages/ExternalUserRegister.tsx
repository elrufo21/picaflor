import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";

import { API_BASE_URL } from "@/config";
import { useCanalVenta } from "@/modules/fullday/hooks/useCanalVenta";

type FormState = {
  canalVentaId: string;
  nombres: string;
  apellidos: string;
  usuarioAlias: string;
  email: string;
  telefono: string;
};

const emptyForm: FormState = {
  canalVentaId: "",
  nombres: "",
  apellidos: "",
  usuarioAlias: "",
  email: "",
  telefono: "",
};

type RegisterResponse = {
  solicitudId?: number;
  SolicitudId?: number;
  correoEnviado?: boolean;
  CorreoEnviado?: boolean;
  correosAdmin?: string;
  CorreosAdmin?: string;
};

const ExternalUserRegister = () => {
  const { canalVentaList } = useCanalVenta();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedCanales = useMemo(
    () =>
      [...canalVentaList].sort((a, b) =>
        String(a.label).localeCompare(String(b.label)),
      ),
    [canalVentaList],
  );

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "usuarioAlias" ? value.replace(/\s+/g, "") : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const payload = {
      canalVentaId: Number(form.canalVentaId),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      usuarioAlias: form.usuarioAlias.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
    };

    if (!payload.canalVentaId || !payload.nombres || !payload.apellidos || !payload.usuarioAlias) {
      setError("Completa canal, nombres, apellidos y usuario.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/SolicitudesUsuarioExterno`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "text/plain, application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = (await response.text()).trim();
        throw new Error(text || "No se pudo registrar la solicitud.");
      }

      const rawResponse = (await response.text()).trim();
      let result: RegisterResponse | number | null = null;
      try {
        result = rawResponse ? JSON.parse(rawResponse) : null;
      } catch {
        result = Number(rawResponse);
      }

      const correoEnviado =
        typeof result === "object" && result !== null
          ? Boolean(result.correoEnviado ?? result.CorreoEnviado)
          : false;
      const correosAdmin =
        typeof result === "object" && result !== null
          ? String(result.correosAdmin ?? result.CorreosAdmin ?? "").trim()
          : "";

      setForm(emptyForm);
      setMessage(
        correoEnviado
          ? `Solicitud registrada. Correo enviado a ${correosAdmin || "administracion"}.`
          : "Solicitud registrada, pero no se pudo enviar el correo al administrador.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo registrar la solicitud.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8">
        <section className="grid w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl md:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-slate-900 md:block">
            <img
              src="/images/viajes_picaflor.png"
              alt="Viajes Picaflor"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <img
                src="/images/picaflorIcono.png"
                alt="Picaflor"
                className="h-10 w-10 rounded-lg bg-white p-1"
              />
              <div>
                <h1 className="text-xl font-semibold">Solicitud de acceso</h1>
                <p className="text-sm text-slate-300">Usuario externo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Canal de venta</span>
                <select
                  value={form.canalVentaId}
                  onChange={(event) => updateField("canalVentaId", event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  required
                >
                  <option value="" className="text-slate-900">
                    Seleccionar canal
                  </option>
                  {sortedCanales.map((canal) => (
                    <option key={canal.value} value={canal.value} className="text-slate-900">
                      {canal.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">Nombres</span>
                  <input
                    value={form.nombres}
                    onChange={(event) => updateField("nombres", event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">Apellidos</span>
                  <input
                    value={form.apellidos}
                    onChange={(event) => updateField("apellidos", event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Usuario / Alias</span>
                <input
                  value={form.usuarioAlias}
                  onChange={(event) => updateField("usuarioAlias", event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">Telefono</span>
                  <input
                    value={form.telefono}
                    onChange={(event) => updateField("telefono", event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  {error}
                </p>
              ) : null}

              {message ? (
                <p className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </button>
            </form>

            <Link
              to="/login"
              className="mt-5 inline-block text-sm text-cyan-200 hover:text-cyan-100"
            >
              Volver al login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ExternalUserRegister;
