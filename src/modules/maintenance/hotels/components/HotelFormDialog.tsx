import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { SelectControlled, TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import type { Hotel } from "@/types/maintenance";
import { useHotelRegions } from "../useHotelRegions";
import TimePickerControlled from "@/components/ui/inputs/TimePickerControlled";

export type HotelFormValues = {
  hotel: string;
  region: string;
  horaIngreso: string;
  horaSalida: string;
  direccion: string;
};

type HotelFormDialogProps = {
  formRef: MutableRefObject<UseFormReturn<HotelFormValues> | null>;
  initialData?: Partial<Hotel>;
};

const buildDefaults = (data?: Partial<Hotel>): HotelFormValues => ({
  hotel: data?.hotel ?? "",
  region: data?.region ?? "",
  horaIngreso: data?.horaIngreso ?? "",
  horaSalida: data?.horaSalida ?? "",
  direccion: data?.direccion ?? "",
});

export default function HotelFormDialog({
  formRef,
  initialData,
}: HotelFormDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);
  const form = useForm<HotelFormValues>({
    defaultValues: defaults,
  });

  const { control, reset } = form;
  const { data: regions = [], isLoading } = useHotelRegions();
  const regionOptions = useMemo(() => {
    const mapped = regions.map((region) => ({
      value: region.nombre,
      label: region.nombre,
    }));
    if (
      defaults.region &&
      !mapped.some((option) => option.value === defaults.region)
    ) {
      mapped.unshift({
        value: defaults.region,
        label: defaults.region,
      });
    }
    return mapped;
  }, [regions, defaults.region]);

  useEffect(() => {
    formRef.current = form;
    return () => {
      if (formRef.current === form) {
        formRef.current = null;
      }
    };
  }, [form, formRef]);

  useEffect(() => {
    reset(defaults);
    focusFirstInput(containerRef.current);
  }, [defaults, reset]);

  return (
    <form
      ref={containerRef}
      className="space-y-4 gap-2"
      onKeyDown={handleEnterFocus}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="mb-3">
        {" "}
        <SelectControlled
          name="region"
          control={control}
          label="Región"
          size="small"
          required
          options={regionOptions}
          helperText={isLoading ? "Cargando regiones..." : undefined}
          disabled={isLoading && !regionOptions.length}
        />
      </div>
      <TextControlled
        name="hotel"
        control={control}
        label="Hotel"
        placeholder="Ingrese nombre del hotel"
        size="small"
        required
        inputProps={{ "data-focus-first": "true" }}
        transform={(v) => v.toUpperCase()}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <TimePickerControlled
          name="horaIngreso"
          control={control}
          label="Hora de ingreso"
          size="small"
        />
        <TimePickerControlled
          name="horaSalida"
          control={control}
          label="Hora de salida"
          size="small"
        />
      </div>
      <TextControlled
        name="direccion"
        control={control}
        label="Dirección"
        placeholder="Ingrese dirección"
        size="small"
        multiline
        rows={3}
        transform={(v) => v.toUpperCase()}
      />
    </form>
  );
}
