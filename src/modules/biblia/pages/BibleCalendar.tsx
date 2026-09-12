import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CarFront,
  Plus,
} from "lucide-react";
import { useDialogStore, type DialogPayload } from "@/app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { TableTextInput } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { focusNextElement } from "@/shared/helpers/formFocus";
import {
  deleteBibleCalendarEvent,
  listBibleCalendarEvents,
  loadBibleCalendarCatalogs,
  saveBibleCalendarEvent,
  type BibleCalendarCatalogOption,
  type BibleCalendarCatalogs,
  type BibleCalendarEvent as CalendarEvent,
} from "../api/bibleCalendarApi";

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const hours = Array.from({ length: 16 }, (_, index) => index + 5);
const monthFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  year: "numeric",
});
const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
});

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fromDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  result.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
const emptyCatalogs: BibleCalendarCatalogs = {
  products: [], counters: [], canales: [], transportes: [], guias: [],
};
const languages = ["ESPAÑOL", "INGLÉS", "PORTUGUÉS", "FRANCÉS", "OTRO"];

const SelectField = ({ label, value, options, onChange, placeholder = "Seleccione", required = false }: {
  label: string;
  value: string;
  options: BibleCalendarCatalogOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}{required ? <span className="text-rose-600"> *</span> : null}
    <select
      value={value}
      required={required}
      onChange={(event) => {
        onChange(event.target.value);
        const target = event.currentTarget;
        setTimeout(() => focusNextElement(target, target.closest("form")), 0);
      }}
      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700"
    >
      <option value="">{placeholder}</option>
      {options.map((option, index) => <option key={`${option.id}-${index}`} value={option.id}>{option.label}</option>)}
    </select>
  </label>
);

export default function BibleCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [catalogs, setCatalogs] = useState<BibleCalendarCatalogs>(emptyCatalogs);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const openDialog = useDialogStore((state) => state.openDialog);
  const usuarioId = Number(useAuthStore((state) => state.user?.id) ?? 0);
  const weekStart = startOfWeek(selectedDate);
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(week[6]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setEvents(await listBibleCalendarEvents(weekStartKey, weekEndKey));
    } catch (error) {
      setEvents([]);
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar la agenda.");
    } finally {
      setLoading(false);
    }
  }, [weekEndKey, weekStartKey]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    void loadBibleCalendarCatalogs()
      .then(setCatalogs)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los catálogos."))
      .finally(() => setCatalogsLoading(false));
  }, []);

  const miniCalendarDays = useMemo(() => {
    const month = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const firstWeekday = (month.getDay() + 6) % 7;
    const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

    return Array.from({ length: 42 }, (_, index) =>
      index < firstWeekday || index >= firstWeekday + totalDays
        ? null
        : new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1),
    );
  }, [selectedDate]);

  const eventsByDate = useMemo(
    () =>
      events.reduce<Record<string, CalendarEvent[]>>((result, event) => {
        (result[event.date] ??= []).push(event);
        return result;
      }, {}),
    [events],
  );
  const selectedEvents = (eventsByDate[toDateKey(selectedDate)] ?? []).sort((a, b) =>
    a.time.localeCompare(b.time),
  );

  const openEventDialog = (
    date: Date,
    time = "09:00",
    currentEvent?: CalendarEvent,
  ) => {
    if (catalogsLoading) {
      setLoadError("Espere un momento mientras se cargan los catálogos.");
      return;
    }

    openDialog({
      title: currentEvent ? "Editar actividad" : "Nueva actividad",
      description: "Los cambios se guardan en la agenda del sistema.",
      size: "xl",
      confirmLabel: currentEvent ? "Guardar cambios" : "Crear actividad",
      dangerLabel: currentEvent ? "Eliminar" : undefined,
      initialPayload: {
        title: currentEvent?.title ?? "",
        date: currentEvent?.date ?? toDateKey(date),
        time: currentEvent?.time ?? time,
        monitored: currentEvent?.monitored ?? false,
        counterId: currentEvent?.counterId ?? "",
        productId: currentEvent?.productId ?? "",
        idioma: currentEvent?.idioma ?? "",
        pax: currentEvent?.pax ?? "",
        noteId: currentEvent?.noteId ?? "",
        auxiliarId: currentEvent?.auxiliarId ?? "",
        clientId: currentEvent?.clientId ?? "",
        transportId: currentEvent?.transportId ?? "",
        guideId: currentEvent?.guideId ?? "",
        observacion: currentEvent?.observacion ?? "",
        estado: "ACTIVO",
      },
      content: ({ payload, setPayload }) => (
        <form onSubmit={(event) => event.preventDefault()} className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {catalogsLoading ? <p className="text-sm text-slate-400">Cargando catálogos...</p> : null}
          <label className="block text-sm font-medium text-slate-700">
            Operación <span className="text-rose-600">*</span>
            <TableTextInput
              value={String(payload.title ?? "")}
              onChange={(title) => setPayload({ ...payload, title })}
              placeholder="Ej. Recojo hotel / tour"
              className="mt-1"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Fecha <span className="text-rose-600">*</span>
              <input
                type="date"
                required
                value={String(payload.date ?? "")}
                onChange={(event) => setPayload({ ...payload, date: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Hora <span className="text-rose-600">*</span>
              <input
                type="time"
                required
                value={String(payload.time ?? "")}
                onChange={(event) => setPayload({ ...payload, time: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={Boolean(payload.monitored)} onChange={(event) => setPayload({ ...payload, monitored: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
              Monitoreado
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Counter" required value={String(payload.counterId ?? "")} options={catalogs.counters} onChange={(counterId) => setPayload({ ...payload, counterId })} />
            <SelectField label="Servicio / destino" value={String(payload.productId ?? "")} options={catalogs.products} onChange={(productId) => setPayload({ ...payload, productId })} />
            <SelectField label="Idioma" value={String(payload.idioma ?? "")} options={languages.map((language) => ({ id: language, label: language }))} onChange={(idioma) => setPayload({ ...payload, idioma })} />
            <label className="block text-sm font-medium text-slate-700">
              CNT. PAX <span className="text-rose-600">*</span>
              <TableTextInput type="number" value={String(payload.pax ?? "")} onChange={(pax) => setPayload({ ...payload, pax })} className="mt-1" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              LQ / reserva
              <TableTextInput value={String(payload.noteId ?? "")} onChange={(noteId) => setPayload({ ...payload, noteId })} placeholder="Ej. 44838" className="mt-1" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Cliente
              <TableTextInput value={String(payload.clientId ?? "")} onChange={(clientId) => setPayload({ ...payload, clientId })} placeholder="Nombre del cliente" className="mt-1" />
            </label>
            <SelectField label="Canal / contacto" value={String(payload.auxiliarId ?? "")} options={catalogs.canales} onChange={(auxiliarId) => setPayload({ ...payload, auxiliarId })} />
            <SelectField label="Transporte" value={String(payload.transportId ?? "")} options={catalogs.transportes} onChange={(transportId) => setPayload({ ...payload, transportId })} />
            <SelectField label="Guía" value={String(payload.guideId ?? "")} options={catalogs.guias} onChange={(guideId) => setPayload({ ...payload, guideId })} />
            <p className="self-end rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Estado: Activo</p>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Observación
            <textarea value={String(payload.observacion ?? "")} onChange={(event) => setPayload({ ...payload, observacion: event.target.value })} rows={3} className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-700" />
          </label>
        </form>
      ),
      onConfirm: async (payload: DialogPayload) => {
        const title = String(payload.title ?? "").trim();
        const date = String(payload.date ?? "");
        const eventTime = String(payload.time ?? "");
        const counterId = String(payload.counterId ?? "");
        const pax = String(payload.pax ?? "");
        if (!title || !date || !eventTime || !counterId || !pax.trim() || Number(pax) <= 0) {
          showToast({
            title: "Completa los campos obligatorios",
            description: "Operación, Counter, Fecha, Hora y CNT. PAX son requeridos.",
            type: "warning",
          });
          return false;
        }

        try {
          await saveBibleCalendarEvent({
            id: currentEvent?.id,
            date,
            time: eventTime,
            title,
            monitored: Boolean(payload.monitored),
            counterId,
            productId: String(payload.productId ?? ""),
            idioma: String(payload.idioma ?? ""),
            pax,
            noteId: String(payload.noteId ?? ""),
            auxiliarId: String(payload.auxiliarId ?? ""),
            clientId: String(payload.clientId ?? ""),
            transportId: String(payload.transportId ?? ""),
            guideId: String(payload.guideId ?? ""),
            observacion: String(payload.observacion ?? ""),
            estado: "ACTIVO",
            usuarioId,
          });
          setSelectedDate(fromDateKey(date));
          await loadEvents();
          return true;
        } catch (error) {
          setLoadError(error instanceof Error ? error.message : "No se pudo guardar la actividad.");
          return false;
        }
      },
      onDanger: currentEvent
        ? async () => {
            try {
              await deleteBibleCalendarEvent(currentEvent.id, usuarioId);
              await loadEvents();
              return true;
            } catch (error) {
              setLoadError(error instanceof Error ? error.message : "No se pudo eliminar la actividad.");
              return false;
            }
          }
        : undefined,
    });
  };

  const isToday = (date: Date) => toDateKey(date) === toDateKey(today);
  const isSelected = (date: Date) => toDateKey(date) === toDateKey(selectedDate);
  const moveWeek = (offset: number) => setSelectedDate((date) => addDays(date, offset * 7));

  return (
    <div className="w-full space-y-4">
      <header className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800">
          <CalendarDays size={22} className="text-sky-600" />
          <span className="font-semibold">Calendario</span>
        </div>
        <button
          type="button"
          onClick={() => openEventDialog(selectedDate)}
          disabled={catalogsLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60"
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
          <button type="button" onClick={() => moveWeek(-1)} aria-label="Semana anterior" className="p-2 text-slate-600 hover:bg-slate-50">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => moveWeek(1)} aria-label="Semana siguiente" className="border-l border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
            <ChevronRight size={18} />
          </button>
        </div>
        <h1 className="min-w-40 text-lg font-semibold capitalize text-slate-800">
          {monthFormatter.format(weekStart)}
        </h1>
        {loading ? <span className="text-sm text-slate-400">Cargando agenda...</span> : null}
        <span className="ml-auto rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
          Semana
        </span>
      </header>

      {loadError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <p className="mb-3 text-sm font-semibold capitalize text-slate-700">
            {monthFormatter.format(selectedDate)}
          </p>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-slate-400">
            {weekdays.map((weekday) => <span key={weekday} className="py-1">{weekday.slice(0, 1)}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {miniCalendarDays.map((date, index) =>
              date ? (
                <button
                  key={toDateKey(date)}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`relative mx-auto h-7 w-7 rounded-full text-xs transition ${
                    isSelected(date)
                      ? "bg-sky-600 text-white"
                      : isToday(date)
                        ? "bg-sky-100 text-sky-700"
                        : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {date.getDate()}
                  {eventsByDate[toDateKey(date)]?.length ? <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" /> : null}
                </button>
              ) : <span key={`empty-${index}`} />, 
            )}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Actividades del día</p>
            <div className="space-y-2">
              {selectedEvents.length ? selectedEvents.map((event) => (
                <button key={event.id} type="button" onClick={() => openEventDialog(fromDateKey(event.date), event.time, event)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50">
                  <span className={`h-2 w-2 rounded-full ${event.color}`} />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{event.time} · {event.title}</span>
                </button>
              )) : <p className="text-xs text-slate-400">Sin actividades.</p>}
            </div>
          </div>
        </aside>

        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-w-[970px]">
            <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "72px repeat(7, minmax(128px, 1fr))" }}>
              <div />
              {week.map((date, index) => (
                <button key={toDateKey(date)} type="button" onClick={() => setSelectedDate(date)} className="border-l border-slate-200 px-2 py-3 text-center hover:bg-slate-50">
                  <span className="block text-[11px] font-semibold uppercase text-slate-500">{weekdays[index]}</span>
                  <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-lg ${isToday(date) ? "bg-sky-600 text-white" : "text-slate-800"}`}>{date.getDate()}</span>
                </button>
              ))}
            </div>

            {hours.map((hour) => (
              <div key={hour} className="grid" style={{ gridTemplateColumns: "72px repeat(7, minmax(128px, 1fr))" }}>
                <div className="border-b border-slate-200 pr-3 pt-2 text-right text-xs text-slate-400">{formatHour(hour)}</div>
                {week.map((date) => {
                  const cellEvents = (eventsByDate[toDateKey(date)] ?? []).filter((event) => event.time.slice(0, 2) === String(hour).padStart(2, "0"));
                  return (
                    <div key={toDateKey(date)} className="relative h-16 border-b border-l border-slate-200 p-1">
                      <button
                        type="button"
                        onClick={() => openEventDialog(date, formatHour(hour))}
                        className="absolute inset-0 hover:bg-sky-50"
                        aria-label={`Crear actividad el ${toDateKey(date)} a las ${formatHour(hour)}`}
                      />
                      <div className="relative z-10">
                        {cellEvents.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => openEventDialog(fromDateKey(event.date), event.time, event)}
                            className={`mb-1 block w-full truncate rounded px-2 py-1 text-left text-xs font-medium text-white ${event.color}`}
                          >
                            {event.time} {event.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock3 size={14} /> Haz clic en un bloque horario para registrar una actividad.
      </div>
    </div>
  );
}
