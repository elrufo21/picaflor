import { useCallback, useEffect, useState, type PointerEvent } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Save,
  Table2,
} from "lucide-react";
import {
  TableSelectInput,
  TableTextareaInput,
  TableTextInput,
} from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { useDialogStore } from "@/app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import {
  listBibleCalendarEvents,
  loadBibleCalendarCatalogs,
  saveBibleCalendarEvent,
  type BibleCalendarCatalogs,
  type BibleCalendarEvent,
} from "../api/bibleCalendarApi";
import BibleWeekCalendar from "../components/BibleWeekCalendar";
import BibleActivityFields, {
  type BibleActivityDraft,
} from "../components/BibleActivityFields";

type DailyRow = BibleCalendarEvent & {
  localId: string;
  isNew?: boolean;
  dirty?: boolean;
};

const languages = ["ESPAÑOL", "INGLÉS", "PORTUGUÉS", "FRANCÉS", "OTRO"];
const emptyCatalogs: BibleCalendarCatalogs = {
  products: [],
  counters: [],
  canales: [],
  transportes: [],
  guias: [],
};
const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const startOfWeek = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - ((date.getDay() + 6) % 7),
  );
const titleFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthTitleFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  year: "numeric",
});
const bibleColumns = [
  { key: "hora", label: "Hora", width: 104, minWidth: 90 },
  { key: "operacion", label: "Operación", width: 168, minWidth: 120 },
  { key: "monitoreado", label: "Monitoreado", width: 116, minWidth: 100 },
  { key: "counter", label: "Counter", width: 150, minWidth: 110 },
  { key: "destino", label: "Destino", width: 210, minWidth: 140 },
  { key: "idioma", label: "Idioma", width: 110, minWidth: 95 },
  { key: "pax", label: "CNT PAX", width: 104, minWidth: 85 },
  { key: "servicio", label: "Servicio", width: 360, minWidth: 240 },
  { key: "cliente", label: "Cliente", width: 185, minWidth: 130 },
  { key: "lq", label: "LQ", width: 102, minWidth: 80 },
  { key: "contacto", label: "Contacto", width: 190, minWidth: 130 },
  { key: "telefono", label: "Teléf.", width: 150, minWidth: 110 },
  { key: "transporte", label: "Transporte", width: 195, minWidth: 130 },
  { key: "guia", label: "Guía", width: 165, minWidth: 110 },
] as const;
const initialColumnWidths = Object.fromEntries(
  bibleColumns.map((column) => [column.key, column.width]),
);
const blankRows = (date: string) =>
  Array.from({ length: 3 }, () => newRow(date));
const rowHasContent = (row: DailyRow) =>
  Boolean(
    row.time ||
    row.title.trim() ||
    row.monitored ||
    row.idioma ||
    row.pax ||
    row.noteId ||
    row.service.trim() ||
    row.counterId ||
    row.auxiliarId ||
    row.clientId ||
    row.transportId ||
    row.guideId ||
    row.destination ||
    row.telefono ||
    row.observacion,
  );

const newRow = (date: string): DailyRow => ({
  id: "",
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  isNew: true,
  dirty: true,
  date,
  time: "",
  title: "",
  color: "",
  monitored: false,
  idioma: "",
  pax: "",
  noteId: "",
  service: "",
  counterId: "",
  auxiliarId: "",
  clientId: "",
  transportId: "",
  guideId: "",
  destination: "",
  telefono: "",
  observacion: "",
  estado: "ACTIVO",
});

export default function BibleCalendar() {
  const navigate = useNavigate();
  const openDialog = useDialogStore((state) => state.openDialog);
  const usuarioId = Number(useAuthStore((state) => state.user?.id) ?? 0);
  const canAccessAction = useModulePermissionsStore(
    (state) => state.canAccessAction,
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<BibleCalendarEvent[]>(
    [],
  );
  const [view, setView] = useState<"table" | "calendar">("calendar");
  const [catalogs, setCatalogs] =
    useState<BibleCalendarCatalogs>(emptyCatalogs);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [columnWidths, setColumnWidths] =
    useState<Record<string, number>>(initialColumnWidths);
  const selectedKey = toDateKey(selectedDate);
  const selectedWeekKey = toDateKey(startOfWeek(selectedDate));
  const canCreate = canAccessAction("biblia", "create");
  const canEdit = canAccessAction("biblia", "edit");

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const events = await listBibleCalendarEvents(selectedKey, selectedKey);
      const savedRows = events
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((event) => ({ ...event, localId: event.id }));
      setRows([...savedRows, ...blankRows(selectedKey)]);
    } catch (loadError) {
      setRows([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la agenda diaria.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  const loadWeekEvents = useCallback(async () => {
    const firstDay = fromDateKey(selectedWeekKey);
    const lastDay = addDays(firstDay, 6);
    setCalendarLoading(true);
    try {
      setCalendarEvents(
        await listBibleCalendarEvents(toDateKey(firstDay), toDateKey(lastDay)),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el calendario semanal.",
      );
    } finally {
      setCalendarLoading(false);
    }
  }, [selectedWeekKey]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);
  useEffect(() => {
    void loadWeekEvents();
  }, [loadWeekEvents]);
  useEffect(() => {
    void loadBibleCalendarCatalogs()
      .then(setCatalogs)
      .catch((catalogError) =>
        setError(
          catalogError instanceof Error
            ? catalogError.message
            : "No se pudieron cargar los catálogos.",
        ),
      )
      .finally(() => setCatalogsLoading(false));
  }, []);

  const updateRow = (localId: string, patch: Partial<DailyRow>) => {
    setRows((current) =>
      current.map((row) =>
        row.localId === localId ? { ...row, ...patch, dirty: true } : row,
      ),
    );
  };

  const startColumnResize = (
    event: PointerEvent<HTMLButtonElement>,
    key: string,
    minWidth: number,
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = columnWidths[key];
    const resize = (moveEvent: globalThis.PointerEvent) => {
      setColumnWidths((current) => ({
        ...current,
        [key]: Math.max(minWidth, startWidth + moveEvent.clientX - startX),
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const saveChanges = async () => {
    const changedRows = rows.filter((row) =>
      row.isNew ? rowHasContent(row) : row.dirty,
    );
    if (!changedRows.length) {
      showToast({
        title: "Agenda diaria",
        description: "No hay cambios por guardar.",
        type: "info",
      });
      return;
    }
    if (
      changedRows.some(
        (row) =>
          !row.date || !row.time || !row.counterId || Number(row.pax) <= 0,
      )
    ) {
      showToast({
        title: "Completa la fila",
        description:
          "Hora, counter y PAX son requeridos. Operación es opcional.",
        type: "warning",
      });
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        changedRows.map((row) =>
          saveBibleCalendarEvent({
            id: row.isNew ? undefined : row.id,
            date: row.date,
            time: row.time,
            title: row.title,
            monitored: row.monitored,
            idioma: row.idioma,
            pax: row.pax,
            noteId: row.noteId,
            service: row.service,
            counterId: row.counterId,
            auxiliarId: row.auxiliarId,
            clientId: row.clientId,
            transportId: row.transportId,
            guideId: row.guideId,
            destination: row.destination,
            telefono: row.telefono,
            observacion: row.observacion,
            estado: "ACTIVO",
            usuarioId,
          }),
        ),
      );
      showToast({
        title: "Agenda diaria",
        description: "Cambios guardados correctamente.",
        type: "success",
      });
      await Promise.all([loadRows(), loadWeekEvents()]);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openActivityDialog = (
    date: Date,
    time = "09:00",
    event?: BibleCalendarEvent,
  ) => {
    const editing = Boolean(event?.id);
    if (editing ? !canEdit : !canCreate) return;

    const draft: BibleActivityDraft = {
      id: event?.id,
      date: event?.date ?? toDateKey(date),
      time: event?.time ?? time,
      title: event?.title ?? "",
      monitored: event?.monitored ?? false,
      idioma: event?.idioma ?? "",
      pax: event?.pax ?? "",
      noteId: event?.noteId ?? "",
      service: event?.service ?? "",
      counterId: event?.counterId ?? "",
      auxiliarId: event?.auxiliarId ?? "",
      clientId: event?.clientId ?? "",
      transportId: event?.transportId ?? "",
      guideId: event?.guideId ?? "",
      destination: event?.destination ?? "",
      telefono: event?.telefono ?? "",
      observacion: event?.observacion ?? "",
    };

    openDialog({
      title: editing ? "Editar actividad" : "Crear actividad",
      description: "Registra los datos que se mostrarán en el calendario.",
      size: "lg",
      confirmLabel: editing ? "Guardar" : "Crear",
      initialPayload: draft,
      content: ({ payload, setPayload }) => (
        <BibleActivityFields
          value={payload as BibleActivityDraft}
          catalogs={catalogs}
          onChange={(patch) =>
            setPayload((current) => ({ ...current, ...patch }))
          }
        />
      ),
      onConfirm: async (payload) => {
        const values = payload as BibleActivityDraft;
        if (
          !values.title.trim() ||
          !values.date ||
          !values.time ||
          !values.counterId ||
          Number(values.pax) <= 0
        ) {
          showToast({
            title: "Completa los campos obligatorios",
            description:
              "Operación, counter, fecha, hora y CNT. PAX son requeridos.",
            type: "warning",
          });
          return false;
        }

        try {
          await saveBibleCalendarEvent({
            ...values,
            id: values.id || undefined,
            estado: "ACTIVO",
            usuarioId,
          });
          showToast({
            title: "Calendario",
            description: editing
              ? "Actividad actualizada correctamente."
              : "Actividad registrada correctamente.",
            type: "success",
          });
          await Promise.all([loadRows(), loadWeekEvents()]);
          return true;
        } catch (saveError) {
          setError(
            saveError instanceof Error
              ? saveError.message
              : "No se pudo guardar la actividad.",
          );
          return false;
        }
      },
    });
  };

  const renderRow = (row: DailyRow, index: number) => {
    const editable = row.isNew ? canCreate : canEdit;
    const disabled = !editable || saving;
    const change = (patch: Partial<DailyRow>) => updateRow(row.localId, patch);
    return (
      <tr
        key={row.localId}
        className={
          row.isNew ? "bg-emerald-50/60" : "bg-white hover:bg-sky-50/35"
        }
      >
        <td>
          <TableTextInput
            type="time"
            value={row.time}
            onChange={(time) => change({ time })}
            disabled={disabled}
            navColumn="hora"
            navRow={index}
          />
        </td>
        <td>
          <TableTextInput
            value={row.title}
            onChange={(title) => change({ title })}
            disabled={disabled}
            placeholder="RECOJO / TOUR"
            navColumn="operacion"
            navRow={index}
          />
        </td>
        <td className="text-center">
          <input
            type="checkbox"
            checked={row.monitored}
            disabled={disabled}
            onChange={(event) => change({ monitored: event.target.checked })}
            className="h-4 w-4 accent-emerald-600"
            aria-label="Monitoreado"
          />
        </td>
        <td>
          <TableSelectInput
            value={row.counterId}
            onChange={(counterId) => change({ counterId })}
            options={catalogs.counters}
            disabled={disabled || catalogsLoading}
          />
        </td>
        <td>
          <TableTextInput
            value={row.destination}
            onChange={(destination) => change({ destination })}
            disabled={disabled}
            placeholder="DESTINO"
            navColumn="destino"
            navRow={index}
          />
        </td>
        <td>
          <TableSelectInput
            value={row.idioma}
            onChange={(idioma) => change({ idioma })}
            options={languages.map((language) => ({
              id: language,
              label: language,
            }))}
            disabled={disabled}
            placeholder="-"
          />
        </td>
        <td>
          <TableTextInput
            type="text"
            inputMode="numeric"
            value={row.pax}
            onChange={(pax) => change({ pax })}
            disabled={disabled}
            textAlign="center"
            navColumn="pax"
            navRow={index}
          />
        </td>
        <td>
          <TableTextareaInput
            value={row.service}
            onChange={(service) => change({ service })}
            disabled={disabled}
            placeholder="SERVICIO"
            maxLength={500}
          />
        </td>
        <td>
          <TableTextInput
            value={row.clientId}
            onChange={(clientId) => change({ clientId })}
            disabled={disabled}
            placeholder="CLIENTE"
            navColumn="cliente"
            navRow={index}
          />
        </td>
        <td>
          <TableTextInput
            value={row.noteId}
            onChange={(noteId) => change({ noteId })}
            disabled={disabled}
            placeholder="LQ"
            navColumn="lq"
            navRow={index}
          />
        </td>
        <td>
          <TableSelectInput
            value={row.auxiliarId}
            onChange={(auxiliarId) => change({ auxiliarId })}
            options={catalogs.canales}
            disabled={disabled || catalogsLoading}
            placeholder="Sin contacto"
          />
        </td>
        <td>
          <TableTextInput
            value={row.telefono}
            onChange={(telefono) => change({ telefono })}
            disabled={disabled}
            placeholder="TELÉFONO"
            navColumn="telefono"
            navRow={index}
          />
        </td>
        <td>
          <TableSelectInput
            value={row.transportId}
            onChange={(transportId) => change({ transportId })}
            options={catalogs.transportes}
            disabled={disabled || catalogsLoading}
            placeholder="Sin transporte"
          />
        </td>
        <td>
          <TableSelectInput
            value={row.guideId}
            onChange={(guideId) => change({ guideId })}
            options={catalogs.guias}
            disabled={disabled || catalogsLoading}
            placeholder="Sin guía"
          />
        </td>
      </tr>
    );
  };

  return (
    <div className="w-full space-y-4">
      <header className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800">
          <CalendarDays size={22} className="text-sky-600" />
          <span className="font-semibold">
            {view === "calendar" ? "Calendario" : "Gestión diaria"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => openActivityDialog(selectedDate)}
          disabled={!canCreate || catalogsLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={17} /> Crear
        </button>
        <button
          type="button"
          onClick={() => navigate("/biblia/movilidad")}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        >
          <CarFront size={17} /> Movilidad
        </button>
        <button
          type="button"
          onClick={() => setSelectedDate(new Date())}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Hoy
        </button>
        <div className="flex items-center rounded-lg border border-slate-300">
          <button
            type="button"
            onClick={() =>
              setSelectedDate((date) =>
                view === "calendar" ? addDays(date, -7) : addDays(date, -1),
              )
            }
            className="p-2 text-slate-600 hover:bg-slate-50"
            aria-label={
              view === "calendar" ? "Semana anterior" : "Día anterior"
            }
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() =>
              setSelectedDate((date) =>
                view === "calendar" ? addDays(date, 7) : addDays(date, 1),
              )
            }
            className="border-l border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
            aria-label={
              view === "calendar" ? "Semana siguiente" : "Día siguiente"
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {view === "table" ? (
          <input
            type="date"
            value={selectedKey}
            onChange={(event) =>
              setSelectedDate(fromDateKey(event.target.value))
            }
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-700"
          />
        ) : null}
        <h1 className="min-w-40 text-lg font-semibold capitalize text-slate-800">
          {view === "calendar"
            ? monthTitleFormatter.format(selectedDate)
            : titleFormatter.format(selectedDate)}
        </h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5">
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${
                view === "calendar"
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CalendarDays size={16} /> Semana
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${
                view === "table"
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Table2 size={16} /> Tabla
            </button>
          </div>
          <button
            type="button"
            onClick={() => void Promise.all([loadRows(), loadWeekEvents()])}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
          {view === "table" ? (
            <button
              type="button"
              onClick={() => void saveChanges()}
              disabled={saving || !rows.some((row) => row.isNew || row.dirty)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} /> Guardar cambios
            </button>
          ) : null}
          {view === "table" ? (
            <button
              type="button"
              onClick={() =>
                setRows((current) => [...current, newRow(selectedKey)])
              }
              disabled={!canCreate || catalogsLoading || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} /> Nueva fila
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {view === "calendar" ? (
        <BibleWeekCalendar
          date={selectedDate}
          events={calendarEvents}
          loading={calendarLoading}
          onSelectDate={(date) => {
            setSelectedDate(date);
          }}
          onOpenActivity={openActivityDialog}
        />
      ) : (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-max table-fixed border-collapse text-sm">
            <colgroup>
              {bibleColumns.map((column) => (
                <col
                  key={column.key}
                  style={{ width: columnWidths[column.key] }}
                />
              ))}
            </colgroup>
            <thead className="bg-[#dbe7f8] text-[11px] uppercase tracking-wide text-slate-700">
              <tr>
                {bibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className="relative border-b border-r border-slate-300 px-2 py-3 font-semibold last:border-r-0"
                  >
                    {column.label}
                    <button
                      type="button"
                      aria-label={`Cambiar ancho de ${column.label}`}
                      title="Arrastra para cambiar el ancho"
                      onPointerDown={(event) =>
                        startColumnResize(event, column.key, column.minWidth)
                      }
                      className="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize touch-none border-l border-transparent hover:border-sky-500 hover:bg-sky-400/20"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_td]:border-b [&_td]:border-r [&_td]:border-slate-200 [&_td]:p-1 last:[&_td]:border-r-0">
              {loading ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Cargando actividades del día...
                  </td>
                </tr>
              ) : null}
              {!loading && !rows.length ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No hay actividades para este día. Usa “Nueva fila” para
                    registrar una.
                  </td>
                </tr>
              ) : null}
              {!loading ? rows.map(renderRow) : null}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
