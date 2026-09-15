import type { BibleCalendarCatalogs } from "../api/bibleCalendarApi";

export type BibleActivityDraft = {
  id?: string;
  date: string;
  time: string;
  title: string;
  monitored: boolean;
  idioma: string;
  pax: string;
  noteId: string;
  service: string;
  counterId: string;
  auxiliarId: string;
  clientId: string;
  transportId: string;
  guideId: string;
  destination: string;
  telefono: string;
  observacion: string;
};

type Props = {
  value: BibleActivityDraft;
  catalogs: BibleCalendarCatalogs;
  onChange: (patch: Partial<BibleActivityDraft>) => void;
};

const languages = ["", "ESPAÑOL", "INGLÉS", "PORTUGUÉS", "FRANCÉS", "OTRO"];
const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none";

export default function BibleActivityFields({
  value,
  catalogs,
  onChange,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Operación
        <input
          value={value.title}
          onChange={(event) =>
            onChange({ title: event.target.value.toUpperCase() })
          }
          className={fieldClass}
          placeholder="Ej. Recojo hotel / tour"
          autoFocus
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Fecha
        <input
          type="date"
          value={value.date}
          onChange={(event) => onChange({ date: event.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Hora
        <input
          type="time"
          value={value.time}
          onChange={(event) => onChange({ time: event.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Counter
        <select
          value={value.counterId}
          onChange={(event) => onChange({ counterId: event.target.value })}
          className={fieldClass}
        >
          <option value="">Seleccione</option>
          {catalogs.counters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        CNT. PAX
        <input
          value={value.pax}
          onChange={(event) => onChange({ pax: event.target.value })}
          inputMode="numeric"
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Servicio
        <textarea
          value={value.service}
          onChange={(event) =>
            onChange({ service: event.target.value.toUpperCase() })
          }
          maxLength={500}
          rows={2}
          className={`${fieldClass} resize-y`}
          placeholder="Servicio"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Destino
        <input
          value={value.destination}
          onChange={(event) =>
            onChange({ destination: event.target.value.toUpperCase() })
          }
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Idioma
        <select
          value={value.idioma}
          onChange={(event) => onChange({ idioma: event.target.value })}
          className={fieldClass}
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              {language || "Seleccione"}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Cliente
        <input
          value={value.clientId}
          onChange={(event) =>
            onChange({ clientId: event.target.value.toUpperCase() })
          }
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Teléfono
        <input
          value={value.telefono}
          onChange={(event) => onChange({ telefono: event.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Contacto
        <select
          value={value.auxiliarId}
          onChange={(event) => onChange({ auxiliarId: event.target.value })}
          className={fieldClass}
        >
          <option value="">Sin contacto</option>
          {catalogs.canales.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Transporte
        <select
          value={value.transportId}
          onChange={(event) => onChange({ transportId: event.target.value })}
          className={fieldClass}
        >
          <option value="">Sin transporte</option>
          {catalogs.transportes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Guía
        <select
          value={value.guideId}
          onChange={(event) => onChange({ guideId: event.target.value })}
          className={fieldClass}
        >
          <option value="">Sin guía</option>
          {catalogs.guias.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={value.monitored}
          onChange={(event) => onChange({ monitored: event.target.checked })}
          className="h-4 w-4 accent-sky-600"
        />
        Monitoreado
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Observación
        <textarea
          value={value.observacion}
          onChange={(event) => onChange({ observacion: event.target.value })}
          rows={3}
          className={`${fieldClass} resize-y`}
        />
      </label>
    </div>
  );
}
