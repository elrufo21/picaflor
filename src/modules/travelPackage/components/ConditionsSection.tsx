import { MenuItem, TextField } from "@mui/material";
import { ShieldCheck } from "lucide-react";
import { IDIOMA_OPTIONS } from "../constants/travelPackage.constants";
import type { TravelPackageFormState } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

type Props = {
    form: TravelPackageFormState;
    onUpdateField: <K extends keyof TravelPackageFormState>(
        key: K,
        value: TravelPackageFormState[K],
    ) => void;
};

const ConditionsSection = ({ form, onUpdateField }: Props) => (
    <SectionCard
        icon={ShieldCheck}
        title="6. Condiciones del Servicio"
        description="Campos finales informativos del paquete."
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
                select
                size="small"
                label="Idioma"
                value={form.idioma}
                onChange={(e) => onUpdateField("idioma", e.target.value)}
            >
                {IDIOMA_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                size="small"
                type="number"
                label="Impuestos adicionales"
                value={form.impuestosAdicionales}
                onChange={(e) => onUpdateField("impuestosAdicionales", e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
                multiline
                minRows={4}
                size="small"
                label="Incluye"
                value={form.incluye}
                onChange={(e) => onUpdateField("incluye", e.target.value)}
            />
            <TextField
                multiline
                minRows={4}
                size="small"
                label="No incluye"
                value={form.noIncluye}
                onChange={(e) => onUpdateField("noIncluye", e.target.value)}
            />
        </div>

        <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Observaciones"
            value={form.observaciones}
            onChange={(e) => onUpdateField("observaciones", e.target.value)}
        />
    </SectionCard>
);

export default ConditionsSection;
