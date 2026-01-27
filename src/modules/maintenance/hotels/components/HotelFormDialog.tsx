import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import type { Hotel } from "@/types/maintenance";

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
      className="space-y-4"
      onKeyDown={handleEnterFocus}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextControlled
          name="hotel"
          control={control}
          label="Hotel"
          placeholder="Ingrese nombre del hotel"
          size="small"
          required
          inputProps={{ "data-focus-first": "true" }}
        />
        <TextControlled
          name="region"
          control={control}
          label="Región"
          placeholder="Ej: Lima"
          size="small"
          required
        />
        <TextControlled
          name="horaIngreso"
          control={control}
          label="Hora de ingreso"
          placeholder="Ej: 07:00"
          size="small"
        />
        <TextControlled
          name="horaSalida"
          control={control}
          label="Hora de salida"
          placeholder="Ej: 22:00"
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
      />
    </form>
  );
}
