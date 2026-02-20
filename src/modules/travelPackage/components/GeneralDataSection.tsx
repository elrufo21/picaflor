import { Autocomplete, Chip, MenuItem, TextField } from "@mui/material";
import { ClipboardList } from "lucide-react";
import {
    DESTINO_OPTIONS,
    MOVILIDAD_OPTIONS,
} from "../constants/travelPackage.constants";
import type {
    SelectOption,
    TravelPackageFormState,
} from "../types/travelPackage.types";
import SectionCard from "./SectionCard";
import TravelDateRangePicker from "./TravelDateRangePicker";

type Props = {
    form: TravelPackageFormState;
    onUpdateField: <K extends keyof TravelPackageFormState>(
        key: K,
        value: TravelPackageFormState[K],
    ) => void;
};

const GeneralDataSection = ({ form, onUpdateField }: Props) => (
    <SectionCard
        icon={ClipboardList}
        title="1. Datos Generales"
        description="Informacion base del paquete turístico."
    >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="lg:col-span-1">
                <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Fecha de emision"
                    InputLabelProps={{ shrink: true }}
                    value={form.fechaEmision}
                    onChange={(e) => onUpdateField("fechaEmision", e.target.value)}
                />
            </div>

            <div className="lg:col-span-3">
                <TextField
                    fullWidth
                    size="small"
                    label="Programa"
                    value={form.programa}
                    onChange={(e) => onUpdateField("programa", e.target.value)}
                />
            </div>

            <div className="lg:col-span-2">
                <TravelDateRangePicker
                    from={form.fechaInicioViaje}
                    to={form.fechaFinViaje}
                    onChangeFrom={(value) => onUpdateField("fechaInicioViaje", value)}
                    onChangeTo={(value) => onUpdateField("fechaFinViaje", value)}
                />
            </div>

            <div className="lg:col-span-2">
                <Autocomplete<string, true, false, false>
                    multiple
                    size="small"
                    options={DESTINO_OPTIONS}
                    value={form.destinos}
                    onChange={(_, value) => onUpdateField("destinos", value)}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                {...getTagProps({ index })}
                                key={`${option}-${index}`}
                                label={option}
                                size="small"
                            />
                        ))
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            label="Destinos"
                            placeholder="Seleccionar"
                        />
                    )}
                />
            </div>

            {/* Mobility fields side-by-side or stacked? Side by side fits well in 4 cols */}
            <div className="lg:col-span-1">
                <TextField
                    fullWidth
                    select
                    size="small"
                    label="Movilidad Tipo"
                    value={form.movilidadTipo}
                    onChange={(e) => onUpdateField("movilidadTipo", e.target.value)}
                >
                    {MOVILIDAD_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>
            </div>
            <div className="lg:col-span-3">
                <TextField
                    fullWidth
                    size="small"
                    label="Empresa de transporte"
                    value={form.movilidadEmpresa}
                    onChange={(e) => onUpdateField("movilidadEmpresa", e.target.value)}
                />
            </div>
        </div>
    </SectionCard>
);

export default GeneralDataSection;
