import { Autocomplete, TextField } from "@mui/material";
import { BriefcaseBusiness } from "lucide-react";
import { AGENCIA_OPTIONS } from "../constants/travelPackage.constants";
import type { TravelPackageFormState, SelectOption } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

type Props = {
    form: TravelPackageFormState;
    onUpdateField: <K extends keyof TravelPackageFormState>(
        key: K,
        value: TravelPackageFormState[K],
    ) => void;
    onUpdateAgencia: (value: SelectOption | null) => void;
};

const AgencySection = ({ form, onUpdateField, onUpdateAgencia }: Props) => (
    <SectionCard
        icon={BriefcaseBusiness}
        title="2. Canal / Agencia"
        description="Canal comercial y datos de contacto."
    >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Autocomplete<SelectOption, false, false, false>
                size="small"
                options={AGENCIA_OPTIONS}
                value={form.agencia}
                onChange={(_, value) => onUpdateAgencia(value)}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                    <TextField {...params} size="small" label="Agencia" />
                )}
            />
            <TextField
                size="small"
                label="Counter"
                value={form.counter}
                InputProps={{ readOnly: true }}
            />
            <TextField
                size="small"
                label="Contacto"
                value={form.contacto}
                onChange={(e) => onUpdateField("contacto", e.target.value)}
            />
            <TextField
                size="small"
                label="Telefono"
                value={form.telefono}
                onChange={(e) => onUpdateField("telefono", e.target.value)}
            />
            <TextField
                size="small"
                type="email"
                label="Email"
                value={form.email}
                onChange={(e) => onUpdateField("email", e.target.value)}
            />
        </div>
    </SectionCard>
);

export default AgencySection;
