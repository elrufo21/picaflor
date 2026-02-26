import { Autocomplete, Chip, TextField } from "@mui/material";
import { ClipboardList } from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CONDICION_PAGO_OPTIONS,
  TRAVEL_PACKAGE_SELECTOR_OPTIONS,
} from "../constants/travelPackage.constants";
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

  const selectedPackageOptions = useMemo(() => {
    const selectedIds = new Set((form.paquetesViaje ?? []).map((item) => item.id));
    return TRAVEL_PACKAGE_SELECTOR_OPTIONS.filter((option) => selectedIds.has(option.id));
  }, [form.paquetesViaje]);

  const handlePackageSelectionChange = (
    nextOptions: typeof TRAVEL_PACKAGE_SELECTOR_OPTIONS,
  ) => {
    const currentById = new Map((form.paquetesViaje ?? []).map((item) => [item.id, item]));
    const next = nextOptions.map((option) => {
      const current = currentById.get(option.id);
      if (current) return current;
      return {
        ...option,
        cantPax:
          option.id === 3
            ? Math.max(1, Math.floor(Number(form.cantPax || 0) || 1))
            : option.cantPax,
        cantidad: 1,
      };
    });
    onUpdateField("paquetesViaje", next);
  };

  const updateSelectedPackageCantidad = (id: number, value: string) => {
    const nextCantidad = Math.max(0, Math.floor(Number(value || 0) || 0));
    onUpdateField(
      "paquetesViaje",
      (form.paquetesViaje ?? []).map((item) =>
        item.id === id ? { ...item, cantidad: nextCantidad } : item,
      ),
    );
  };

  const updateSelectedPackageCantPax = (id: number, value: string) => {
    const nextCantPax = Math.max(0, Math.floor(Number(value || 0) || 0));
    onUpdateField(
      "paquetesViaje",
      (form.paquetesViaje ?? []).map((item) =>
        item.id === id ? { ...item, cantPax: nextCantPax } : item,
      ),
    );
  };

  return (
    <SectionCard
      icon={ClipboardList}
      title="1. Datos Generales"
      description="Informacion base del paquete turístico."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <Autocomplete
            multiple
            disableCloseOnSelect
            size="small"
            options={TRAVEL_PACKAGE_SELECTOR_OPTIONS}
            value={selectedPackageOptions}
            onChange={(_, value) =>
              handlePackageSelectionChange(value as typeof TRAVEL_PACKAGE_SELECTOR_OPTIONS)
            }
            getOptionLabel={(option) => option.paquete}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  size="small"
                  label={
                    option.id === 3
                      ? `${option.paquete} (${option.cantPax} pax)`
                      : `${option.paquete} x${option.cantidad}`
                  }
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Paquete de viaje" />
            )}
          />
          {(form.paquetesViaje ?? []).length > 0 && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(form.paquetesViaje ?? []).map((item) => (
                <TextField
                  key={item.id}
                  size="small"
                  type="number"
                  label={
                    item.id === 3
                      ? `Pax ${item.paquete}`
                      : `Cantidad ${item.paquete}`
                  }
                  value={
                    item.id === 3
                      ? item.cantPax === 0
                        ? ""
                        : item.cantPax
                      : item.cantidad === 0
                        ? ""
                        : item.cantidad
                  }
                  onChange={(event) => {
                    if (item.id === 3) {
                      updateSelectedPackageCantPax(item.id, event.target.value);
                      return;
                    }
                    updateSelectedPackageCantidad(item.id, event.target.value);
                  }}
                  inputProps={{ min: 0 }}
                />
              ))}
            </div>
          )}
        </div>

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
            label="Cantidad Pax"
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
