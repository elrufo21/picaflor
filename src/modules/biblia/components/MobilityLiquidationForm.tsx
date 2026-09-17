import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { CarFront, Plus, Save, Trash2 } from "lucide-react";
import { SelectControlled, TextControlled } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { useAuthStore } from "@/store/auth/auth.store";
import {
  loadBibleCalendarCatalogs,
  type BibleCalendarCatalogs,
} from "../api/bibleCalendarApi";
import {
  saveMobilityLiquidation,
  type MobilityLine,
} from "../api/mobilityLiquidationApi";

type FormValues = {
  fechaRegistro: string;
  counterId: string;
  canalId: string;
  cliente: string;
  telefono: string;
  condicion: string;
  moneda: string;
  formaPago: string;
  lineas: MobilityLine[];
};

type Props = {
  initialDate: string;
  initialTime: string;
  onSaved: () => Promise<void> | void;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyCatalogs: BibleCalendarCatalogs = {
  products: [], counters: [], canales: [], transportes: [], guias: [],
};
const newLine = (fecha: string, hora: string): MobilityLine => ({
  fecha, hora, operacion: "RECOJO", origen: "", destino: "", pax: "", precio: "",
  servicio: "", observacion: "", transporteId: "", guiaId: "",
});

export default function MobilityLiquidationForm({ initialDate, initialTime, onSaved }: Props) {
  const usuarioId = Number(useAuthStore((state) => state.user?.id) ?? 0);
  const initialValues = (): FormValues => ({
    fechaRegistro: today(),
    counterId: usuarioId > 0 ? String(usuarioId) : "",
    canalId: "",
    cliente: "",
    telefono: "",
    condicion: "CONTADO",
    moneda: "SOLES",
    formaPago: "EFECTIVO",
    lineas: [newLine(initialDate, initialTime)],
  });
  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: initialValues(),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });
  const [catalogs, setCatalogs] = useState<BibleCalendarCatalogs>(emptyCatalogs);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const lineas = watch("lineas");
  const total = lineas.reduce((sum, line) => sum + (Number(line.precio) || 0), 0);

  useEffect(() => {
    void loadBibleCalendarCatalogs()
      .then(setCatalogs)
      .catch((error) => showToast({
        title: "Movilidad",
        description: error instanceof Error ? error.message : "No se pudieron cargar los catálogos.",
        type: "error",
      }))
      .finally(() => setLoadingCatalogs(false));
  }, []);

  const submit = async (values: FormValues) => {
    if (!values.counterId || !values.canalId || !values.cliente.trim()) {
      showToast({ title: "Completa la liquidación", description: "Counter, canal de venta y cliente son requeridos.", type: "warning" });
      return;
    }
    if (values.lineas.some((line) =>
      !line.fecha || !line.hora || !line.operacion.trim() || !line.origen.trim() ||
      !line.destino.trim() || Number(line.pax) <= 0 || Number(line.precio) < 0,
    )) {
      showToast({ title: "Revisa las líneas", description: "Cada movilidad requiere fecha, hora, operación, origen, destino, PAX y precio.", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const result = await saveMobilityLiquidation({
        ...values, cliente: values.cliente.trim(), usuarioId,
      });
      showToast({ title: "Liquidación registrada", description: result.split("|")[2] || "Las movilidades ya están en La Biblia.", type: "success" });
      await onSaved();
    } catch (error) {
      showToast({ title: "No se pudo guardar", description: error instanceof Error ? error.message : "Inténtalo nuevamente.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const money = watch("moneda") === "DOLARES" ? "US$" : "S/";

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <CarFront className="text-emerald-700" size={21} />
          <span className="font-semibold text-slate-800">Movilidad</span>
          <span className="text-sm text-slate-500">{fields.length} registro(s)</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => reset(initialValues())} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"><Plus size={16} /> Nuevo</button>
          <button type="submit" disabled={saving || loadingCatalogs} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Save size={16} /> {saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2"><SelectControlled name="canalId" control={control} label="Canal de venta" required size="small" disabled={loadingCatalogs} options={[{ value: "", label: "Seleccione" }, ...catalogs.canales.map((item) => ({ value: item.id, label: item.label }))]} /></div>
            <SelectControlled name="counterId" control={control} label="Counter" required size="small" disabled options={[{ value: "", label: "Seleccione" }, ...catalogs.counters.map((item) => ({ value: item.id, label: item.label }))]} />
            <SelectControlled name="moneda" control={control} label="Moneda" required size="small" options={[{ value: "SOLES", label: "Soles" }, { value: "DOLARES", label: "Dólares" }]} />
            <div className="md:col-span-2"><TextControlled name="cliente" control={control} label="Cliente" required size="small" /></div>
            <TextControlled name="telefono" control={control} label="Teléfono" size="small" />
            <TextControlled name="fechaRegistro" control={control} label="Fecha de registro" type="date" required size="small" disabled />
          </div>

          <fieldset className="rounded-xl border border-slate-200 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <legend className="text-sm font-semibold text-slate-700">Detalle de movilidades</legend>
              <button type="button" onClick={() => append(newLine(initialDate, initialTime))} className="inline-flex items-center gap-1 rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"><Plus size={16} /> Agregar movilidad</button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <article key={field.id} className="rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2"><strong className="text-sm">Movilidad {index + 1}</strong>{fields.length > 1 ? <button type="button" onClick={() => remove(index)} className="inline-flex items-center gap-1 text-sm text-rose-600"><Trash2 size={16} /> Quitar</button> : null}</div>
                  <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
                    <TextControlled name={`lineas.${index}.fecha` as const} control={control} label="Fecha" type="date" required size="small" />
                    <TextControlled name={`lineas.${index}.hora` as const} control={control} label="Hora" type="time" required size="small" />
                    <SelectControlled name={`lineas.${index}.operacion` as const} control={control} label="Operación" required size="small" options={[{ value: "RECOJO", label: "Recojo" }, { value: "TRASLADO", label: "Traslado" }, { value: "RETORNO", label: "Retorno" }]} />
                    <TextControlled name={`lineas.${index}.pax` as const} control={control} label="Cant. PAX" required size="small" inputProps={{ inputMode: "numeric" }} />
                    <TextControlled name={`lineas.${index}.origen` as const} control={control} label="Punto de partida" required size="small" />
                    <TextControlled name={`lineas.${index}.destino` as const} control={control} label="Destino" required size="small" />
                    <SelectControlled name={`lineas.${index}.servicio` as const} control={control} label="Servicio" size="small" options={[{ value: "", label: "Sin servicio" }, ...catalogs.products.map((item) => ({ value: item.label, label: item.label }))]} />
                    <TextControlled name={`lineas.${index}.precio` as const} control={control} label="Precio" required size="small" inputProps={{ inputMode: "decimal" }} />
                    <SelectControlled name={`lineas.${index}.transporteId` as const} control={control} label="Transporte" size="small" options={[{ value: "", label: "Pendiente de asignar" }, ...catalogs.transportes.map((item) => ({ value: item.id, label: item.label }))]} />
                    <SelectControlled name={`lineas.${index}.guiaId` as const} control={control} label="Guía" size="small" options={[{ value: "", label: "Sin guía" }, ...catalogs.guias.map((item) => ({ value: item.id, label: item.label }))]} />
                    <div className="md:col-span-2"><TextControlled name={`lineas.${index}.observacion` as const} control={control} label="Observación" size="small" /></div>
                  </div>
                </article>
              ))}
            </div>
          </fieldset>
        </section>

        <aside className="space-y-3">
          <section className="overflow-hidden rounded-lg border border-slate-300 text-sm">
            {["TOTAL A PAGAR", "ACUENTA", "SALDO"].map((label, index) => <div key={label} className="grid grid-cols-3 border-b border-slate-300 last:border-0"><strong className="col-span-2 bg-amber-300 px-3 py-2 text-amber-950">{label} {index !== 1 ? `${money}:` : ":"}</strong><span className="px-3 py-2 text-right font-semibold">{index === 1 ? "0.00" : total.toFixed(2)}</span></div>)}
          </section>
          <section className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-sm font-semibold">Medio de pago</p>
            <div className="space-y-3"><SelectControlled name="formaPago" control={control} label="" required size="small" options={[{ value: "EFECTIVO", label: "Efectivo" }, { value: "YAPE", label: "Yape" }, { value: "DEPOSITO", label: "Depósito" }, { value: "TARJETA", label: "Tarjeta" }]} /><SelectControlled name="condicion" control={control} label="Condición" required size="small" options={[{ value: "CONTADO", label: "Contado" }, { value: "ACUENTA", label: "A cuenta" }, { value: "CREDITO", label: "Crédito" }]} /></div>
          </section>
        </aside>
      </div>
    </form>
  );
}
