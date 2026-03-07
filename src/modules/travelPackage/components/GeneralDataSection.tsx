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
import { refreshServiciosData } from "@/app/db/serviciosSync";
import {
  serviciosDB,
  type ProductoCityTourOrdena,
  type Ubigeo,
} from "@/app/db/serviciosDB";

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
  const [regionesCityTour, setRegionesCityTour] = useState<
    ProductoCityTourOrdena[]
  >([]);
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
      try {
        let [ubigeosRows, cityTourRows] = await Promise.all([
          serviciosDB.ubigeos.toArray(),
          serviciosDB.productosCityTourOrdena.toArray(),
        ]);

        // Si City Tour no está poblado aún en local, forzamos sync y reintentamos.
        if (!cityTourRows.length) {
          await refreshServiciosData();
          [ubigeosRows, cityTourRows] = await Promise.all([
            serviciosDB.ubigeos.toArray(),
            serviciosDB.productosCityTourOrdena.toArray(),
          ]);
        }

        if (!active) return;
        setRegiones(ubigeosRows);
        setRegionesCityTour(cityTourRows);
      } catch (error) {
        console.error("Error cargando regiones para paquete de viaje", error);
      }
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
    regionesCityTour.forEach((item) => {
      const nombre = String(item.region ?? item.nombre ?? "").trim();
      if (!nombre) return;
      unique.add(nombre);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [regiones, regionesCityTour]);

  const selectedPackageOptions = useMemo(() => {
    const selectedIds = new Set(
      (form.paquetesViaje ?? []).map((item) => item.id),
    );
    return TRAVEL_PACKAGE_SELECTOR_OPTIONS.filter((option) =>
      selectedIds.has(option.id),
    );
  }, [form.paquetesViaje]);

  const handlePackageSelectionChange = (
    nextOptions: typeof TRAVEL_PACKAGE_SELECTOR_OPTIONS,
  ) => {
    const currentById = new Map(
      (form.paquetesViaje ?? []).map((item) => [item.id, item]),
    );
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
        {/**   <div className="md:col-span-3">
          <Autocomplete
            multiple
            disableCloseOnSelect
            size="small"
            options={TRAVEL_PACKAGE_SELECTOR_OPTIONS}
            value={selectedPackageOptions}
            onChange={(_, value) =>
              handlePackageSelectionChange(
                value as typeof TRAVEL_PACKAGE_SELECTOR_OPTIONS,
              )
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
              <TextField
                {...params}
                label="Paquete de viaje"
                autoComplete="off"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: "new-password",
                  name: "nh-paquete-viaje-autocomplete",
                  autoCorrect: "off",
                  spellCheck: false,
                  autoCapitalize: "none",
                  "aria-autocomplete": "none",
                  "data-lpignore": "true",
                  "data-1p-ignore": "true",
                  "data-bwignore": "true",
                  "data-form-type": "other",
                  "data-autocomplete": "off",
                }}
              />
            )}
          />
          {(form.paquetesViaje ?? []).length > 0 && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(form.paquetesViaje ?? []).map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Paquete
                        </th>
                        <th className="px-3 py-2 text-left font-medium w-[140px]">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-slate-200">
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {item.paquete}
                        </td>
                        <td className="px-3 py-2">
                          <TextField
                            size="small"
                            type="number"
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
                                updateSelectedPackageCantPax(
                                  item.id,
                                  event.target.value,
                                );
                                return;
                              }
                              updateSelectedPackageCantidad(
                                item.id,
                                event.target.value,
                              );
                            }}
                            inputProps={{
                              min: 0,
                              style: { textAlign: "center" },
                            }}
                            sx={{ width: "120px" }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
 */}
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
            options={[
              { value: "", label: "SELECCIONE" },
              ...CONDICION_PAGO_OPTIONS,
            ]}
            size="small"
            label="Condición"
            InputLabelProps={{ shrink: true }}
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
