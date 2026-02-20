import { Autocomplete, TextField, MenuItem, IconButton } from "@mui/material";
import { Route, Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { PRODUCT_OPTIONS } from "../constants/travelPackage.constants";
import type { ItineraryDayRow, ItineraryEventRow } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

// Set locale globally or locally
dayjs.locale("es");

type Props = {
    itinerario: ItineraryDayRow[];
    onUpdateDayField: <K extends keyof Omit<ItineraryDayRow, "id" | "eventos">>(
        id: number,
        field: K,
        value: ItineraryDayRow[K],
    ) => void;
    onAddDay: () => void;
    onRemoveDay: (id: number) => void;
    onAddEvent: (dayId: number) => void;
    onRemoveEvent: (dayId: number, eventId: number) => void;
    onUpdateEventField: (
        dayId: number,
        eventId: number,
        field: keyof Omit<ItineraryEventRow, "id">,
        value: string,
    ) => void;
};

const ItinerarySection = ({
    itinerario,
    onUpdateDayField,
    onAddDay,
    onRemoveDay,
    onAddEvent,
    onRemoveEvent,
    onUpdateEventField,
}: Props) => (
    <SectionCard
        icon={Route}
        title="5. Itinerario Por Fecha"
        description="Actividades y detalles por día."
    >
        <div className="space-y-6">
            {itinerario.map((day, dayIndex) => {
                // Format date: "10 dic"
                const dateObj = dayjs(day.fecha);
                const dateLabel = dateObj.isValid()
                    ? dateObj.format("DD MMM").toLowerCase()
                    : `Día ${dayIndex + 1}`;

                return (
                    <div
                        key={day.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                    >
                        {/* Header Row: Date & Product Selector */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            {/* Date Badge */}
                            <div className="flex items-center justify-center md:justify-start">
                                <div className="flex flex-col items-center justify-center rounded-lg bg-emerald-100/50 border border-emerald-200 p-2 min-w-[80px]">
                                    <span className="text-2xl font-bold text-emerald-700 leading-none">
                                        {dateObj.isValid() ? dateObj.format("DD") : dayIndex + 1}
                                    </span>
                                    <span className="text-xs font-medium text-emerald-800 uppercase tracking-wide">
                                        {dateObj.isValid() ? dateObj.format("MMM") : "DÍA"}
                                    </span>
                                </div>
                            </div>

                            {/* Product Selector (formerly Title) */}
                            <div className="flex-1">
                                <Autocomplete
                                    freeSolo
                                    options={PRODUCT_OPTIONS}
                                    value={day.titulo}
                                    onChange={(_, newValue) => {
                                        onUpdateDayField(day.id, "titulo", newValue || "");
                                    }}
                                    onInputChange={(_, newInputValue) => {
                                        onUpdateDayField(day.id, "titulo", newInputValue);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Producto / Actividad Principal"
                                            placeholder="Ej: City Tour Arequipa"
                                            size="small"
                                            fullWidth
                                            variant="outlined"
                                            sx={{ backgroundColor: 'white' }}
                                        />
                                    )}
                                />
                            </div>

                            {/* Hotel Fields (Per Day) */}
                            <div className="flex flex-1 gap-2">
                                <TextField
                                    label="Hotel"
                                    value={day.hotel}
                                    onChange={(e) => onUpdateDayField(day.id, "hotel", e.target.value)}
                                    size="small"
                                    fullWidth
                                    sx={{ backgroundColor: 'white' }}
                                />
                                <TextField
                                    label="Habitación"
                                    value={day.tipoHabitacion}
                                    onChange={(e) => onUpdateDayField(day.id, "tipoHabitacion", e.target.value)}
                                    size="small"
                                    className="w-32"
                                    sx={{ backgroundColor: 'white' }}
                                />
                                <TextField
                                    label="Alim."
                                    value={day.alimentacion}
                                    onChange={(e) => onUpdateDayField(day.id, "alimentacion", e.target.value)}
                                    size="small"
                                    className="w-24"
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </div>
                        </div>

                        {/* Sub-events? User didn't specify removing them, but "10 dic y aqui debe dejar seleccionar el producto". 
                I'll keep sub-events if they want detailed breakdown, or maybe hide them if Product covers it?
                The previous requirement said "Itinerary contains multiple events". 
                I will keep them for now but maybe collapsed or less prominent.
            */}
                        <div className="pl-0 md:pl-[100px] space-y-3">
                            {day.eventos.map((event, eventIndex) => (
                                <div key={event.id} className="flex flex-wrap gap-2 items-center bg-white p-2 rounded border border-slate-100">
                                    <TextField
                                        select
                                        label="Tipo"
                                        value={event.tipo}
                                        onChange={(e) =>
                                            onUpdateEventField(day.id, event.id, "tipo", e.target.value)
                                        }
                                        size="small"
                                        className="w-28"
                                    >
                                        <MenuItem value="Traslado">Traslado</MenuItem>
                                        <MenuItem value="Actividad">Actividad</MenuItem>
                                        <MenuItem value="Alimentacion">Alim.</MenuItem>
                                        <MenuItem value="Vuelo">Vuelo</MenuItem>
                                        <MenuItem value="Tren">Tren</MenuItem>
                                        <MenuItem value="Bus">Bus</MenuItem>
                                        <MenuItem value="Otro">Otro</MenuItem>
                                    </TextField>

                                    <TextField
                                        type="time"
                                        label="Hora"
                                        InputLabelProps={{ shrink: true }}
                                        value={event.hora}
                                        onChange={(e) =>
                                            onUpdateEventField(day.id, event.id, "hora", e.target.value)
                                        }
                                        size="small"
                                        className="w-32"
                                    />

                                    <TextField
                                        label="Descripción / Detalle"
                                        value={event.descripcion}
                                        onChange={(e) =>
                                            onUpdateEventField(day.id, event.id, "descripcion", e.target.value)
                                        }
                                        size="small"
                                        className="flex-1 min-w-[200px]"
                                    />

                                    <IconButton
                                        color="error"
                                        onClick={() => onRemoveEvent(day.id, event.id)}
                                        size="small"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </IconButton>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => onAddEvent(day.id)}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2"
                            >
                                <Plus className="h-3 w-3" /> Agregar evento detalle
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Manual Add Day Button - Removed/Hidden as logic is sync-driven 
        <div className="flex justify-center pt-4">
             <Button onClick={onAddDay} ... />
        </div>
    */}
    </SectionCard>
);

export default ItinerarySection;
