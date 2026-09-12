import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { CarFront, ChevronLeft, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { SelectControlled, TextControlled } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { useAuthStore } from "@/store/auth/auth.store";
import { loadBibleCalendarCatalogs, type BibleCalendarCatalogs } from "../api/bibleCalendarApi";
import { saveMobilityLiquidation, type MobilityLine } from "../api/mobilityLiquidationApi";

type FormValues = {
  fechaRegistro: string; counterId: string; canalId: string; cliente: string; telefono: string;
  condicion: string; moneda: string; formaPago: string; lineas: MobilityLine[];
};

const today = () => new Date().toISOString().slice(0, 10);
const newLine = (): MobilityLine => ({ fecha: today(), hora: "", operacion: "RECOJO", origen: "", destino: "", pax: "", precio: "", servicio: "", observacion: "", transporteId: "", guiaId: "" });
const emptyCatalogs: BibleCalendarCatalogs = { products: [], counters: [], canales: [], transportes: [], guias: [] };

export default function MobilityLiquidation() {
  const navigate = useNavigate();
  const usuarioId = Number(useAuthStore((state) => state.user?.id) ?? 0);
  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { fechaRegistro: today(), counterId: usuarioId > 0 ? String(usuarioId) : "", canalId: "", cliente: "", telefono: "", condicion: "CONTADO", moneda: "SOLES", formaPago: "EFECTIVO", lineas: [newLine()] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });
  const [catalogs, setCatalogs] = useState<BibleCalendarCatalogs>(emptyCatalogs);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const lineas = watch("lineas");
  const total = lineas.reduce((sum, line) => sum + (Number(line.precio) || 0), 0);

  useEffect(() => {
    void loadBibleCalendarCatalogs().then(setCatalogs).catch((error) => showToast({ title: "Movilidad", description: error instanceof Error ? error.message : "No se pudieron cargar los catálogos.", type: "error" })).finally(() => setLoadingCatalogs(false));
  }, []);

  const submit = async (values: FormValues) => {
    if (!values.counterId || !values.canalId || !values.cliente.trim()) {
      showToast({ title: "Completa la liquidación", description: "Counter, canal de venta y cliente son requeridos.", type: "warning" });
      return;
    }
    if (values.lineas.some((line) => !line.fecha || !line.hora || !line.operacion.trim() || !line.origen.trim() || !line.destino.trim() || Number(line.pax) <= 0 || Number(line.precio) < 0)) {
      showToast({ title: "Revisa las líneas", description: "Cada movilidad requiere fecha, hora, operación, origen, destino, PAX y precio.", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const result = await saveMobilityLiquidation({ ...values, cliente: values.cliente.trim(), usuarioId });
      showToast({ title: "Liquidación registrada", description: result.split("|")[2] || "Las movilidades ya están en La Biblia.", type: "success" });
      navigate("/biblia");
    } catch (error) {
      showToast({ title: "No se pudo guardar", description: error instanceof Error ? error.message : "Inténtalo nuevamente.", type: "error" });
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-8xl">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit(submit)}>
          <header className="sticky top-2 z-30 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
              <button type="button" onClick={() => navigate("/biblia")} className="rounded-lg p-1 text-slate-700 hover:bg-white" aria-label="Volver"><ChevronLeft size={22} /></button>
              <div className="flex min-w-0 items-center gap-2"><CarFront className="text-emerald-700" size={21} /><span className="text-xs text-slate-500">Servicio:</span><span className="truncate font-semibold text-slate-800">Movilidad</span></div>
              <div className="flex items-center gap-1 whitespace-nowrap"><span className="text-xs text-slate-500">Fec. Registro:</span><span className="text-sm font-medium text-slate-700">{watch("fechaRegistro") || "-"}</span></div>
              <div className="flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 whitespace-nowrap"><span className="text-xs text-slate-500">Mov.:</span><span className="text-sm font-bold text-emerald-700">{fields.length}</span></div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 shrink-0">
              <button type="submit" disabled={saving || loadingCatalogs} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white shadow-sm ring-1 ring-emerald-600/30 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"><Save size={16} /><span className="text-sm">{saving ? "Guardando..." : "Guardar"}</span></button>
              <button type="button" onClick={() => reset({ fechaRegistro: today(), counterId: usuarioId > 0 ? String(usuarioId) : "", canalId: "", cliente: "", telefono: "", condicion: "CONTADO", moneda: "SOLES", formaPago: "EFECTIVO", lineas: [newLine()] })} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"><Plus size={16} /><span className="text-sm">Nuevo</span></button>
            </div>
          </header>

          <main className="p-4 sm:p-5">
            <div className="grid items-start gap-4 lg:grid-cols-6">
              <section className="space-y-4 lg:col-span-4">
                <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2"><SelectControlled name="canalId" control={control} label="Canal de venta" required size="small" disabled={loadingCatalogs} options={[{ value: "", label: "Seleccione" }, ...catalogs.canales.map((item) => ({ value: item.id, label: item.label }))]} /></div>
            <SelectControlled name="counterId" control={control} label="Counter" required size="small" disabled options={[{ value: "", label: "Seleccione" }, ...catalogs.counters.map((item) => ({ value: item.id, label: item.label }))]} />
            <SelectControlled name="moneda" control={control} label="Moneda" required size="small" options={[{ value: "SOLES", label: "Soles" }, { value: "DOLARES", label: "Dólares" }]} />
            <div className="md:col-span-2"><TextControlled name="cliente" control={control} label="Cliente" required size="small" /></div>
            <TextControlled name="telefono" control={control} label="Teléfono" size="small" />
            <TextControlled name="fechaRegistro" control={control} label="Fecha de registro" type="date" required size="small" disabled />
                </div>

          <fieldset className="rounded-xl border border-slate-200 px-3 pb-3 pt-2">
            <legend className="px-1 text-sm font-semibold text-slate-700">Detalle de movilidades</legend>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-500">Cada registro se mostrará como una actividad en La Biblia.</p><button type="button" onClick={() => append(newLine())} className="inline-flex items-center gap-2 rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"><Plus size={16} /> Agregar movilidad</button></div>
            <div className="space-y-3">
              {fields.map((field, index) => <article key={field.id} className="overflow-hidden rounded-lg border border-slate-300">
                <div className="flex items-center justify-between bg-slate-50 px-3 py-2"><strong className="text-sm text-slate-700">Movilidad {index + 1}</strong>{fields.length > 1 ? <button type="button" onClick={() => remove(index)} className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700"><Trash2 size={16} /> Quitar</button> : null}</div>
                <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
                  <TextControlled name={`lineas.${index}.fecha` as const} control={control} label="Fecha" type="date" required size="small" />
                  <TextControlled name={`lineas.${index}.hora` as const} control={control} label="Hora" type="time" required size="small" />
                  <SelectControlled name={`lineas.${index}.operacion` as const} control={control} label="Operación" required size="small" options={[{ value: "RECOJO", label: "Recojo" }, { value: "TRASLADO", label: "Traslado" }, { value: "RETORNO", label: "Retorno" }]} />
                  <TextControlled name={`lineas.${index}.pax` as const} control={control} label="Cant. PAX" required size="small" type="text" inputProps={{ inputMode: "numeric" }} />
                  <TextControlled name={`lineas.${index}.origen` as const} control={control} label="Punto de partida" required size="small" />
                  <TextControlled name={`lineas.${index}.destino` as const} control={control} label="Destino" required size="small" />
                  <SelectControlled name={`lineas.${index}.servicio` as const} control={control} label="Servicio" size="small" options={[{ value: "", label: "Sin servicio" }, ...catalogs.products.map((item) => ({ value: item.label, label: item.label }))]} />
                  <TextControlled name={`lineas.${index}.precio` as const} control={control} label="Precio" required size="small" type="text" inputProps={{ inputMode: "decimal" }} />
                  <SelectControlled name={`lineas.${index}.transporteId` as const} control={control} label="Transporte" size="small" options={[{ value: "", label: "Pendiente de asignar" }, ...catalogs.transportes.map((item) => ({ value: item.id, label: item.label }))]} />
                  <SelectControlled name={`lineas.${index}.guiaId` as const} control={control} label="Guía" size="small" options={[{ value: "", label: "Sin guía" }, ...catalogs.guias.map((item) => ({ value: item.id, label: item.label }))]} />
                  <div className="md:col-span-2"><TextControlled name={`lineas.${index}.observacion` as const} control={control} label="Observación" size="small" /></div>
                </div>
              </article>)}
            </div>
          </fieldset>
              </section>

              <aside className="space-y-3 lg:col-span-2">
                <section>
                  <p className="mb-2 text-sm font-semibold text-slate-800">Precio De Liquidación</p>
                  <div className="overflow-hidden rounded-lg border border-slate-300">
                    <div className="grid grid-cols-3 border-b border-slate-300"><div className="col-span-2 bg-amber-300 px-3 py-2 font-semibold text-amber-900">TOTAL A PAGAR {watch("moneda") === "DOLARES" ? "US$" : "S/"} :</div><div className="px-3 py-2 text-right font-semibold">{total.toFixed(2)}</div></div>
                    <div className="grid grid-cols-3 border-b border-slate-300"><div className="col-span-2 bg-amber-300 px-3 py-2 font-semibold text-amber-900">ACUENTA:</div><div className="px-3 py-2 text-right font-semibold">0.00</div></div>
                    <div className="grid grid-cols-3"><div className="col-span-2 bg-amber-300 px-3 py-2 font-semibold text-amber-900">SALDO {watch("moneda") === "DOLARES" ? "US$" : "S/"} :</div><div className="px-3 py-2 text-right font-semibold">{total.toFixed(2)}</div></div>
                  </div>
                </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5"><h2 className="text-sm font-semibold text-slate-900">Medio Pago</h2><span className="text-[11px] uppercase tracking-wide text-sky-700">Cobranza</span></div>
            <div className="p-3">
              <div className="grid divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[126px_minmax(0,1fr)] items-center"><span className="flex h-full items-center bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Medio de pago</span><div className="bg-white px-2 py-1"><SelectControlled name="formaPago" control={control} label="" required size="small" options={[{ value: "EFECTIVO", label: "Efectivo" }, { value: "YAPE", label: "Yape" }, { value: "DEPOSITO", label: "Depósito" }, { value: "TARJETA", label: "Tarjeta" }]} /></div></div>
                <div className="grid grid-cols-[126px_minmax(0,1fr)] items-center"><span className="flex h-full items-center bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Condición</span><div className="bg-white px-2 py-1"><SelectControlled name="condicion" control={control} label="" required size="small" options={[{ value: "CONTADO", label: "Contado" }, { value: "ACUENTA", label: "A cuenta" }, { value: "CREDITO", label: "Crédito" }]} /></div></div>
              </div>
            </div>
          </section>
              </aside>
            </div>
          </main>
        </form>
      </div>
    </div>
  );
}
