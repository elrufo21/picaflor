import { Autocomplete, Chip, TextField } from "@mui/material";
import { ClipboardList } from "lucide-react";
import { DESTINO_OPTIONS } from "../constants/travelPackage.constants";
import type { TravelPackageFormState } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";
import ProgramTransportFields from "./ProgramTransportFields";
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
      <div className="xl:col-span-3">
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
      <div className="xl:col-span-3">
        <TravelDateRangePicker
          from={form.fechaInicioViaje}
          to={form.fechaFinViaje}
          onChangeFrom={(value) => onUpdateField("fechaInicioViaje", value)}
          onChangeTo={(value) => onUpdateField("fechaFinViaje", value)}
        />
      </div>
      <ProgramTransportFields
        programa={form.programa}
        cantPax={form.cantPax}
        onChange={(field, value) => onUpdateField(field, value)}
      />
    </div>
  </SectionCard>
);

export default GeneralDataSection;
