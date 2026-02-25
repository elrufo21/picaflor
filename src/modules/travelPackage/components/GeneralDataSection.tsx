import { Chip } from "@mui/material";
import { ClipboardList } from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CONDICION_PAGO_OPTIONS } from "../constants/travelPackage.constants";
import type { TravelPackageFormState } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";
import TravelDateRangePicker from "./TravelDateRangePicker";
import {
  AutocompleteControlled,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { serviciosDB, type Ubigeo } from "@/app/db/serviciosDB";

type Props = {
  form: TravelPackageFormState;
  onUpdateField: <K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => void;
};

type GeneralDataFormValues = {
  destinos: string[];
  moneda: "SOLES" | "DOLARES";
  programa: string;
  cantPax: string;
  condicionPago: string;
};

const buildProgramaFromForm = (
  destinos: string[],
  fechaInicioViaje: string,
  fechaFinViaje: string,
) => {
  const destinoText = Array.from(
    new Set(
      (destinos ?? [])
        .map((destino) =>
          String(destino ?? "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ).join("-");

  const start = dayjs(fechaInicioViaje);
  const end = dayjs(fechaFinViaje);
  const hasValidRange =
    start.isValid() && end.isValid() && !end.isBefore(start);

  const durationText = hasValidRange
    ? (() => {
        const diffDays = end.diff(start, "day");
        const days = Math.max(diffDays + 1, 1);
        const nights = Math.max(days - 1, 0);
        return `${days}D/${nights}N`;
      })()
    : "";

  return [destinoText, durationText].filter(Boolean).join(" ").trim();
};

const GeneralDataSection = ({ form, onUpdateField }: Props) => {
  const [regiones, setRegiones] = useState<Ubigeo[]>([]);
  const { control, setValue } = useForm<GeneralDataFormValues>({
    defaultValues: {
      destinos: form.destinos,
      moneda: form.moneda,
      programa: form.programa,
      cantPax: form.cantPax,
      condicionPago: form.condicionPago,
    },
  });

  useEffect(() => {
    setValue("destinos", form.destinos, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.destinos, setValue]);

  useEffect(() => {
    setValue("moneda", form.moneda, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.moneda, setValue]);

  useEffect(() => {
    setValue("programa", form.programa, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.programa, setValue]);

  useEffect(() => {
    setValue("cantPax", form.cantPax, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.cantPax, setValue]);

  useEffect(() => {
    setValue("condicionPago", form.condicionPago, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.condicionPago, setValue]);

  useEffect(() => {
    const nextPrograma = buildProgramaFromForm(
      form.destinos,
      form.fechaInicioViaje,
      form.fechaFinViaje,
    );
    if (nextPrograma !== String(form.programa ?? "")) {
      onUpdateField("programa", nextPrograma);
    }
  }, [
    form.destinos,
    form.fechaInicioViaje,
    form.fechaFinViaje,
    form.programa,
    onUpdateField,
  ]);

  useEffect(() => {
    let active = true;

    const loadRegiones = async () => {
      const ubigeosRows = await serviciosDB.ubigeos.toArray();
      if (!active) return;
      setRegiones(ubigeosRows);
    };

    void loadRegiones();

    return () => {
      active = false;
    };
  }, []);

  const regionOptions = useMemo(() => {
    const unique = new Set<string>();
    regiones.forEach((region) => {
      const nombre = String(region.nombre ?? "").trim();
      if (!nombre) return;
      unique.add(nombre);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [regiones]);

  return (
    <SectionCard
      icon={ClipboardList}
      title="1. Datos Generales"
      description="Informacion base del paquete turístico."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <AutocompleteControlled<GeneralDataFormValues, string, true>
            multiple
            disableCloseOnSelect
            name="destinos"
            control={control}
            label="Destinos"
            options={regionOptions}
            getOptionLabel={(option) => option}
            size="small"
            onValueChange={(value) => onUpdateField("destinos", value)}
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
          />
        </div>

        <div>
          <TravelDateRangePicker
            from={form.fechaInicioViaje}
            to={form.fechaFinViaje}
            onChangeFrom={(value) => onUpdateField("fechaInicioViaje", value)}
            onChangeTo={(value) => onUpdateField("fechaFinViaje", value)}
            focusNextSelector='input[name^="nh-programa-"]'
          />
        </div>

        <div>
          <SelectControlled<GeneralDataFormValues>
            name="moneda"
            control={control}
            options={[
              { value: "SOLES", label: "SOLES" },
              { value: "DOLARES", label: "DOLARES" },
            ]}
            size="small"
            label="Moneda"
            onChange={(event) =>
              onUpdateField(
                "moneda",
                event.target.value as TravelPackageFormState["moneda"],
              )
            }
          />
        </div>

        <div>
          <TextControlled<GeneralDataFormValues>
            name="programa"
            control={control}
            label="Programa"
            size="small"
            onChange={(event) => onUpdateField("programa", event.target.value)}
            inputProps={{ "data-focus-next": 'input[name^="nh-cantpax-"]' }}
          />
        </div>

        <div>
          <TextControlled<GeneralDataFormValues>
            name="cantPax"
            control={control}
            fullWidth
            size="small"
            type="number"
            displayZeroAsEmpty
            label="Cantidad"
            onChange={(event) => onUpdateField("cantPax", event.target.value)}
            inputProps={{ style: { textAlign: "center" } }}
          />
        </div>

        <div>
          <SelectControlled<GeneralDataFormValues>
            name="condicionPago"
            control={control}
            options={CONDICION_PAGO_OPTIONS}
            size="small"
            label="Condición"
            onChange={(event) =>
              onUpdateField("condicionPago", event.target.value)
            }
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default GeneralDataSection;
