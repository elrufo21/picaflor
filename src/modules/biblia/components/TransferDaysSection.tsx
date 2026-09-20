import { Route } from "lucide-react";
import { TextField } from "@mui/material";
import { AutocompleteTable } from "@/components/ui/inputs";
import type { Hotel } from "@/app/db/serviciosDB";
import SectionCard from "@/modules/travelPackage/components/SectionCard";
import type { TransferDay } from "../transferDays";

type Props = {
  days: TransferDay[];
  hoteles: Hotel[];
  onChange: (fecha: string, field: "destino" | "hotel" | "tipoUnidad" | "tipoTraslado" | "detalle" | "hora" | "precio", value: string) => void;
};

export default function TransferDaysSection({ days, hoteles, onChange }: Props) {
  return (
    <SectionCard
      icon={Route}
      title="4. Servicios contratados"
      description="Registra el destino y el detalle del traslado previsto para cada día."
    >
      {!days.length ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
          Selecciona la fecha de salida y regreso para crear los días.
        </p>
      ) : (
        <div className="space-y-3">
          {days.map((day, index) => (
            <div key={day.fecha} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)_150px_150px_130px_150px] lg:items-start">
              <div className="lg:row-span-2">
                <strong className="block text-sm text-emerald-700">Día {index + 1}</strong>
                <span className="text-sm text-slate-600">
                  {new Date(`${day.fecha}T00:00:00`).toLocaleDateString("es-PE")}
                </span>
              </div>
              <TextField
                label="Destino"
                value={day.destino}
                onChange={(event) => onChange(day.fecha, "destino", event.target.value)}
                size="small"
                inputProps={{ maxLength: 200 }}
                fullWidth
              />
              <AutocompleteTable
                label="Hotel"
                options={hoteles}
                value={hoteles.find((hotel) => hotel.nombre === day.hotel) ?? null}
                onChange={(hotel) => onChange(day.fecha, "hotel", hotel?.nombre ?? "")}
                getOptionKey={(hotel) => hotel.id}
                getOptionLabel={(hotel) => hotel.nombre}
                columns={[{ key: "nombre", header: "Hotel", render: (hotel) => hotel.nombre }]}
                placeholder="Seleccionar hotel"
                noOptionsText="Sin hoteles"
              />
              <TextField
                select
                label="Tipo de unidad"
                value={day.tipoUnidad}
                onChange={(event) => onChange(day.fecha, "tipoUnidad", event.target.value)}
                size="small"
                fullWidth
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
              >
                <option value="">Seleccionar</option>
                <option value="AUTO">Auto</option>
                <option value="CAMIONETA">Camioneta</option>
                <option value="VAN">Van</option>
                <option value="MINIBUS">Minibús</option>
                <option value="BUS">Bus</option>
                <option value="OTRO">Otro</option>
              </TextField>
              <TextField
                select
                label="Tipo de traslado"
                value={day.tipoTraslado}
                onChange={(event) => onChange(day.fecha, "tipoTraslado", event.target.value)}
                size="small"
                fullWidth
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
              >
                <option value="">Seleccionar</option>
                <option value="NACIONAL">Nacional</option>
                <option value="INTERNACIONAL">Internacional</option>
              </TextField>
              <TextField
                label="Hora"
                value={day.hora}
                onChange={(event) => onChange(day.fecha, "hora", event.target.value)}
                type="time"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Precio"
                value={day.precio}
                onChange={(event) => onChange(day.fecha, "precio", event.target.value)}
                type="number"
                size="small"
                inputProps={{ min: 0, step: "0.01" }}
                fullWidth
              />
              <TextField
                label="Detalle del traslado"
                value={day.detalle}
                onChange={(event) => onChange(day.fecha, "detalle", event.target.value)}
                multiline
                minRows={2}
                size="small"
                inputProps={{ maxLength: 500 }}
                className="lg:col-span-6"
                fullWidth
              />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
