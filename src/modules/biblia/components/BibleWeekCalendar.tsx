import type { BibleCalendarEvent } from "../api/bibleCalendarApi";

type Props = {
  date: Date;
  events: BibleCalendarEvent[];
  loading?: boolean;
  onSelectDate: (date: Date) => void;
  onOpenActivity: (
    date: Date,
    time?: string,
    event?: BibleCalendarEvent,
  ) => void;
};

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const hours = Array.from({ length: 15 }, (_, index) => index + 5);
const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const startOfWeek = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - ((date.getDay() + 6) % 7),
  );
const toTime = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export default function BibleWeekCalendar({
  date,
  events,
  loading = false,
  onSelectDate,
  onOpenActivity,
}: Props) {
  const weekStart = startOfWeek(date);
  const week = Array.from(
    { length: 7 },
    (_, index) =>
      new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + index,
      ),
  );
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const miniStart = startOfWeek(monthStart);
  const miniDays = Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        miniStart.getFullYear(),
        miniStart.getMonth(),
        miniStart.getDate() + index,
      ),
  );
  const selectedKey = toDateKey(date);
  const selectedEvents = events.filter((event) => event.date === selectedKey);
  const eventsByDate = events.reduce<Record<string, BibleCalendarEvent[]>>(
    (grouped, event) => {
      (grouped[event.date] ??= []).push(event);
      return grouped;
    },
    {},
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
        <p className="mb-3 text-sm font-semibold capitalize text-slate-700">
          {new Intl.DateTimeFormat("es-PE", {
            month: "long",
            year: "numeric",
          }).format(date)}
        </p>
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-slate-400">
          {weekDays.map((day) => (
            <span key={day} className="py-1">
              {day[0]}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {miniDays.map((day) => {
            const dayKey = toDateKey(day);
            const selected = dayKey === selectedKey;
            const today = dayKey === toDateKey(new Date());
            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onSelectDate(day)}
                className={`relative mx-auto h-7 w-7 rounded-full text-xs transition ${
                  selected
                    ? "bg-sky-600 text-white"
                    : today
                      ? "bg-sky-100 text-sky-700"
                      : day.getMonth() === date.getMonth()
                        ? "text-slate-600 hover:bg-slate-100"
                        : "text-slate-300"
                }`}
              >
                {day.getDate()}
                {eventsByDate[dayKey]?.length ? (
                  <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Actividades del día
          </p>
          <div className="space-y-2">
            {selectedEvents.length ? (
              selectedEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onOpenActivity(date, event.time, event)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
                >
                  <span className={`h-2 w-2 rounded-full ${event.color}`} />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-700">
                    {event.time} · {event.title || event.service || "Actividad"}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-400">Sin actividades.</p>
            )}
          </div>
        </div>
      </aside>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[970px] w-full">
          <div
            className="grid border-b border-slate-200"
            style={{
              gridTemplateColumns: "72px repeat(7, minmax(128px, 1fr))",
            }}
          >
            <div />
            {week.map((day, index) => {
              const selected = toDateKey(day) === selectedKey;
              return (
                <button
                  key={toDateKey(day)}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className="border-l border-slate-200 px-2 py-3 text-center hover:bg-slate-50"
                >
                  <span className="block text-[11px] font-semibold uppercase text-slate-500">
                    {weekDays[index]}
                  </span>
                  <span
                    className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-lg ${
                      selected ? "bg-sky-600 text-white" : "text-slate-800"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid"
              style={{
                gridTemplateColumns: "72px repeat(7, minmax(128px, 1fr))",
              }}
            >
              <div className="border-b border-slate-200 pr-3 pt-2 text-right text-xs text-slate-400">
                {toTime(hour)}
              </div>
              {week.map((day) => {
                const hourEvents = (eventsByDate[toDateKey(day)] ?? []).filter(
                  (event) =>
                    event.time.slice(0, 2) === String(hour).padStart(2, "0"),
                );
                return (
                  <div
                    key={toDateKey(day)}
                    className="relative min-h-16 border-b border-l border-slate-200 p-1"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenActivity(day, toTime(hour))}
                      className="absolute inset-0 hover:bg-sky-50"
                      aria-label={`Crear actividad el ${toDateKey(day)} a las ${toTime(hour)}`}
                    />
                    <div className="relative z-10">
                      {hourEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => onOpenActivity(day, event.time, event)}
                          className={`mb-1 block w-full break-words whitespace-normal rounded px-2 py-1.5 text-left text-xs font-medium leading-4 text-white ${event.color}`}
                        >
                          {event.time}{" "}
                          {event.title || event.service || "Actividad"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {loading ? (
          <p className="border-t border-slate-200 px-3 py-2 text-sm text-slate-500">
            Actualizando calendario...
          </p>
        ) : null}
      </section>
    </div>
  );
}
