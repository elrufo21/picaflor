import { useCallback, useEffect, useMemo, useState } from "react";
import { TextField } from "@mui/material";
import { CarFront, ChevronLeft, Plus, Save } from "lucide-react";
import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import { roundCurrency } from "@/shared/helpers/formatCurrency";
import { useAuthStore } from "@/store/auth/auth.store";
import AgencySection from "@/modules/travelPackage/components/AgencySection";
import PassengersSection from "@/modules/travelPackage/components/PassengersSection";
import SectionCard from "@/modules/travelPackage/components/SectionCard";
import TravelDateRangePicker from "@/modules/travelPackage/components/TravelDateRangePicker";
import {
  INITIAL_FORM_STATE,
  createEmptyPassenger,
  getTodayIso,
} from "@/modules/travelPackage/constants/travelPackage.constants";
import type {
  PassengerRow,
  SelectOption,
  TravelPackageFormState,
} from "@/modules/travelPackage/types/travelPackage.types";
import TransferDaysSection from "../components/TransferDaysSection";
import { saveTransfer } from "../api/transferApi";
import { buildTransferDays, type TransferDay } from "../transferDays";

const newForm = (counter: string): TravelPackageFormState => ({
  ...INITIAL_FORM_STATE,
  fechaEmision: getTodayIso(),
  counter,
  moneda: "SOLES",
  cantPax: "1",
  pasajeros: [createEmptyPassenger()],
  itinerario: [],
});

export default function TransferForm() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const counter = String(user?.displayName ?? "").trim();
  const usuarioId = Number(user?.id ?? 0);
  const [form, setForm] = useState(() => newForm(counter));
  const [days, setDays] = useState<TransferDay[]>([]);
  const [saving, setSaving] = useState(false);

  const updateField = useCallback(<K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => setForm((previous) => ({ ...previous, [key]: value })), []);

  const updateAgencia = useCallback((agencia: SelectOption | null) => {
    setForm((previous) => ({ ...previous, agencia }));
  }, []);

  const updatePassenger = useCallback((
    id: number,
    key: keyof Omit<PassengerRow, "id">,
    value: string | number,
  ) => {
    setForm((previous) => ({
      ...previous,
      pasajeros: previous.pasajeros.map((passenger) =>
        passenger.id === id ? { ...passenger, [key]: value } : passenger,
      ),
    }));
  }, []);

  const setPaxCount = (value: string) => {
    const count = Math.min(99, Math.max(0, Number(value.replace(/\D/g, "")) || 0));
    setForm((previous) => ({
      ...previous,
      cantPax: value ? String(count) : "",
      pasajeros: Array.from(
        { length: count },
        (_, index) => previous.pasajeros[index] ?? createEmptyPassenger(),
      ),
    }));
  };

  useEffect(() => {
    setDays((previous) => buildTransferDays(form.fechaInicioViaje, form.fechaFinViaje, previous));
  }, [form.fechaInicioViaje, form.fechaFinViaje]);

  const updateDay = (fecha: string, field: "destino" | "detalle" | "hora" | "precio", value: string) => {
    setDays((previous) => previous.map((day) =>
      day.fecha === fecha ? { ...day, [field]: value } : day,
    ));
  };

  const totals = useMemo(() => {
    const pasajeros = form.pasajeros.reduce(
      (sum, passenger) => sum + roundCurrency(passenger.totalTipoPasajero), 0,
    );
    const servicios = days.reduce((sum, day) => sum + roundCurrency(day.precio), 0);
    return { pasajeros, servicios, total: roundCurrency(pasajeros + servicios) };
  }, [days, form.pasajeros]);

  const money = (value: number) =>
    `${form.moneda === "DOLARES" ? "US$" : "S/"} ${value.toFixed(2)}`;

  const submit = async () => {
    if (!usuarioId || !form.agencia || !form.programa.trim() || !days.length || !form.pasajeros.length) {
      showToast({ title: "Completa el traslado", description: "Indica agencia, programa, fechas y pasajeros.", type: "warning" });
      return;
    }
    if (form.pasajeros.some((passenger) => !passenger.nombres.trim()) ||
        days.some((day) => !day.destino.trim() || !day.hora || !Number.isFinite(Number(day.precio)) || Number(day.precio) < 0)) {
      showToast({ title: "Revisa los datos", description: "Completa el pasajero, destino, hora y precio de cada día.", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const agenciaId = Number(form.agencia.value);
      const id = await saveTransfer({
        fechaEmision: form.fechaEmision,
        fechaInicio: form.fechaInicioViaje,
        fechaFin: form.fechaFinViaje || form.fechaInicioViaje,
        programa: form.programa.trim(),
        counterId: usuarioId,
        agenciaId: Number.isInteger(agenciaId) && agenciaId > 0 ? agenciaId : null,
        agencia: form.agencia.label,
        contacto: form.contacto,
        telefono: form.telefono,
        telefonoPax: form.telPax,
        email: form.email,
        moneda: form.moneda,
        pasajeros: form.pasajeros.map((passenger) => ({
          nombres: passenger.nombres.trim(),
          pasaporte: passenger.pasaporte.trim(),
          nacionalidad: passenger.nacionalidad.trim(),
          telefono: passenger.telefono.trim(),
          fechaNacimiento: passenger.fechaNacimiento || null,
          tipoPasajero: passenger.tipoPasajero,
          totalTipoPasajero: roundCurrency(passenger.totalTipoPasajero),
        })),
        dias: days.map((day) => ({
          fecha: day.fecha,
          destino: day.destino.trim(),
          detalle: day.detalle.trim(),
          hora: day.hora,
          precio: roundCurrency(day.precio),
        })),
      });
      showToast({ title: "Traslado guardado", description: `Registro #${id} creado.`, type: "success" });
      setForm(newForm(counter));
      setDays([]);
    } catch (error) {
      showToast({ title: "No se pudo guardar", description: error instanceof Error ? error.message : "Inténtalo nuevamente.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-8xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <header className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="Volver" className="rounded-lg p-1 text-slate-700 hover:bg-white"><ChevronLeft size={22} /></button>
          <CarFront size={21} className="text-emerald-700" />
          <strong className="text-slate-800">Traslados</strong>
          <span className="text-sm text-slate-600">Fecha emisión: {form.fechaEmision}</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setForm(newForm(counter)); setDays([]); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={16} /> Nuevo</button>
          <button type="button" onClick={() => void submit()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Save size={16} /> {saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </header>

      <main className="mt-4 space-y-2">
        <SectionCard icon={CarFront} title="1. Fecha y programa" description="Selecciona las fechas para crear un servicio por día.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_150px]">
            <TravelDateRangePicker
              from={form.fechaInicioViaje}
              to={form.fechaFinViaje}
              onChangeFrom={(value) => updateField("fechaInicioViaje", value)}
              onChangeTo={(value) => updateField("fechaFinViaje", value)}
            />
            <TextField label="Programa" value={form.programa} onChange={(event) => updateField("programa", event.target.value)} size="small" fullWidth />
            <TextField label="Cantidad Pax" value={form.cantPax} onChange={(event) => setPaxCount(event.target.value)} inputProps={{ inputMode: "numeric", maxLength: 2 }} size="small" fullWidth />
            <TextField select label="Moneda" value={form.moneda} onChange={(event) => updateField("moneda", event.target.value as TravelPackageFormState["moneda"])} size="small" fullWidth SelectProps={{ native: true }}>
              <option value="SOLES">Soles</option>
              <option value="DOLARES">Dólares</option>
            </TextField>
          </div>
        </SectionCard>

        <AgencySection form={form} onUpdateField={updateField} onUpdateAgencia={updateAgencia} />
        <PassengersSection
          pasajeros={form.pasajeros}
          precioPaxGeneral={form.precioPaxGeneral}
          onUpdateField={updatePassenger}
          onAdd={() => setPaxCount(String(form.pasajeros.length + 1))}
          onRemove={(id) => setForm((previous) => ({ ...previous, pasajeros: previous.pasajeros.filter((passenger) => passenger.id !== id) }))}
        />
        <TransferDaysSection days={days} onChange={updateDay} />
        <SectionCard icon={CarFront} title="5. Totales" description="Resumen del traslado.">
          <div className="ml-auto max-w-sm overflow-hidden rounded-xl border border-slate-200 text-sm">
            <div className="flex justify-between border-b border-slate-200 px-4 py-2"><span>Pasajeros</span><strong>{money(totals.pasajeros)}</strong></div>
            <div className="flex justify-between border-b border-slate-200 px-4 py-2"><span>Servicios</span><strong>{money(totals.servicios)}</strong></div>
            <div className="flex justify-between bg-amber-100 px-4 py-3 font-semibold text-amber-950"><span>Total a pagar</span><strong>{money(totals.total)}</strong></div>
          </div>
        </SectionCard>
      </main>
    </div>
  );
}
