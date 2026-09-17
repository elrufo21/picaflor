import { Route } from "lucide-react";
import { TextField } from "@mui/material";
import SectionCard from "@/modules/travelPackage/components/SectionCard";
import type { TransferDay } from "../transferDays";

type Props = {
  days: TransferDay[];
  onChange: (fecha: string, field: "destino" | "detalle" | "hora" | "precio", value: string) => void;
};

export default function TransferDaysSection({ days, onChange }: Props) {
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
            <div key={day.fecha} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[130px_minmax(0,1fr)_130px_150px] md:items-start">
              <div className="md:row-span-2">
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
                className="md:col-span-3"
                fullWidth
              />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
