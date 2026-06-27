import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router";
import { CheckCircle2, Search, Upload } from "lucide-react";

import { API_BASE_URL } from "@/config";
import {
  type SalesChannelDetail,
  useSalesChannels,
} from "@/modules/maintenance/salesChannel/hooks/useSalesChannels";
import {
  isValidRuc,
  lookupRuc,
  normalizeRuc,
} from "@/shared/helpers/lookupRuc";

type FormState = {
  ruc: string;
  razonSocial: string;
  canalVentaId: number | null;
  canalVentaNombre: string;
  canalExiste: boolean;
  nombres: string;
  apellidos: string;
  usuarioAlias: string;
  email: string;
  telefono: string;
  logoPreview: string;
  logoFile: File | null;
};

const emptyForm: FormState = {
  ruc: "",
  razonSocial: "",
  canalVentaId: null,
  canalVentaNombre: "",
  canalExiste: false,
  nombres: "",
  apellidos: "",
  usuarioAlias: "",
  email: "",
  telefono: "",
  logoPreview: "",
  logoFile: null,
};

type RegisterResponse = {
  solicitudId?: number;
  SolicitudId?: number;
  correoEnviado?: boolean;
  CorreoEnviado?: boolean;
  correosAdmin?: string;
  CorreosAdmin?: string;
};

const resolveSalesChannelId = (channel?: SalesChannelDetail) => {
  const id = Number(
    channel?.idAuxiliar ?? channel?.idCanal ?? channel?.id ?? 0,
  );
  return Number.isFinite(id) && id > 0 ? id : null;
};

const ExternalUserRegister = () => {
  const { channels, isLoading: isLoadingChannels } = useSalesChannels();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSearchingRuc, setIsSearchingRuc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const channelByRuc = useMemo(
    () =>
      new Map(
        channels
          .filter((channel) => normalizeRuc(channel.ruc).length > 0)
          .map((channel) => [normalizeRuc(channel.ruc), channel]),
      ),
    [channels],
  );

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      ...(key === "ruc"
        ? {
            ruc: normalizeRuc(value),
            razonSocial: "",
            canalVentaId: null,
            canalVentaNombre: "",
            canalExiste: false,
            logoPreview: "",
            logoFile: null,
          }
        : {
            [key]: key === "usuarioAlias" ? value.replace(/\s+/g, "") : value,
          }),
    }));
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        logoFile: file,
        logoPreview: String(reader.result ?? ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBuscarRuc = async () => {
    setMessage("");
    setError("");

    const ruc = normalizeRuc(form.ruc);
    if (!isValidRuc(ruc)) {
      setError("El RUC debe tener 11 digitos numericos.");
      return;
    }

    const existingChannel = channelByRuc.get(ruc);
    if (existingChannel) {
      const canalVentaId = resolveSalesChannelId(existingChannel);
      setForm((prev) => ({
        ...prev,
        ruc,
        razonSocial:
          existingChannel.razonSocial || existingChannel.canalNombre || "",
        canalVentaId,
        canalVentaNombre: existingChannel.canalNombre || "",
        canalExiste: true,
        logoPreview: "",
        logoFile: null,
      }));
      return;
    }

    setIsSearchingRuc(true);
    try {
      const result = await lookupRuc(ruc);
      setForm((prev) => ({
        ...prev,
        ruc: result.ruc,
        razonSocial: result.razonSocial,
        canalVentaId: null,
        canalVentaNombre: "",
        canalExiste: false,
      }));
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "No se pudo buscar el RUC.",
      );
    } finally {
      setIsSearchingRuc(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const payload = {
      ruc: normalizeRuc(form.ruc),
      razonSocial: form.razonSocial.trim(),
      canalVentaId: form.canalVentaId,
      canalExiste: form.canalExiste,
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      usuarioAlias: form.usuarioAlias.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
    };

    if (
      !isValidRuc(payload.ruc) ||
      !payload.razonSocial ||
      !payload.nombres ||
      !payload.apellidos ||
      !payload.usuarioAlias
    ) {
      setError("Busca el RUC y completa nombres, apellidos y usuario.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("ruc", payload.ruc);
      formData.append("razonSocial", payload.razonSocial);
      formData.append("canalExiste", String(payload.canalExiste));
      if (payload.canalVentaId) {
        formData.append("canalVentaId", String(payload.canalVentaId));
      }
      formData.append("nombres", payload.nombres);
      formData.append("apellidos", payload.apellidos);
      formData.append("usuarioAlias", payload.usuarioAlias);
      formData.append("email", payload.email);
      formData.append("telefono", payload.telefono);
      if (!payload.canalExiste && form.logoFile) {
        formData.append("imagen", form.logoFile);
      }

      const response = await fetch(
        `${API_BASE_URL}/SolicitudesUsuarioExterno`,
        {
          method: "POST",
          headers: {
            accept: "text/plain, application/json",
          },
          body: formData,
        },
      );

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
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">RUC</span>
                  <input
                    value={form.ruc}
                    onChange={(event) => updateField("ruc", event.target.value)}
                    maxLength={11}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    required
                  />
                </label>
                <button
                  type="button"
                  onClick={handleBuscarRuc}
                  disabled={isSearchingRuc || isLoadingChannels}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search className="h-4 w-4" />
                  {isSearchingRuc || isLoadingChannels
                    ? "Buscando..."
                    : "Buscar"}
                </button>
              </div>

              {form.razonSocial ? (
                <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm">
                  <div className="text-slate-300">Razón social</div>
                  <div className="font-medium">{form.razonSocial}</div>
                  <div className="mt-1 text-xs text-slate-300">
                    {form.canalExiste
                      ? `Canal encontrado: ${form.canalVentaNombre || form.razonSocial}`
                      : "Canal no registrado. Administración lo regularizará antes de aprobar."}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">Nombres</span>
                  <input
                    value={form.nombres}
                    onChange={(event) =>
                      updateField("nombres", event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">Apellidos</span>
                  <input
                    value={form.apellidos}
                    onChange={(event) =>
                      updateField("apellidos", event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">
                  Usuario / Alias
                </span>
                <input
                  value={form.usuarioAlias}
                  onChange={(event) =>
                    updateField("usuarioAlias", event.target.value)
                  }
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
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-300">Telefono</span>
                  <input
                    value={form.telefono}
                    onChange={(event) =>
                      updateField("telefono", event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
              </div>
              {form.razonSocial && !form.canalExiste ? (
                <div className="rounded-lg border border-white/10 bg-white/10 p-3 text-sm">
                  <div className="mb-2 text-slate-300">Logo del canal</div>
                  {form.logoPreview ? (
                    <div className="mb-3 h-28 w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      <img
                        src={form.logoPreview}
                        alt="Logo del canal"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-2 font-medium text-white transition hover:bg-white/15">
                    <Upload className="h-4 w-4" />
                    Seleccionar logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : null}
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
