import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";

import { AutocompleteControlled, TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { DeparturePoint } from "@/types/maintenance";

export type PartidaFormValues = {
  destination: string;
  pointName: string;
  horaPartida: string;
  region: string;
  productId: string;
};

type PartidaFormDialogProps = {
  formRef: MutableRefObject<UseFormReturn<PartidaFormValues> | null>;
  initialData?: Partial<DeparturePoint>;
};

const buildDefaults = (data?: Partial<DeparturePoint>): PartidaFormValues => ({
  destination: data?.destination ?? "",
  pointName: data?.pointName ?? "",
  horaPartida: data?.horaPartida ?? "",
  region: data?.region ?? "",
  productId: data?.productId?.toString() ?? "",
});

export default function PartidaFormDialog({
  formRef,
  initialData,
}: PartidaFormDialogProps) {
  const partidas = useMaintenanceStore((s) => s.partidas);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);
  const form = useForm<PartidaFormValues>({
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

  const destinationOptions = useMemo(() => {
    const set = new Set<string>();
    partidas.forEach((partida) => {
      if (partida.destination) {
        set.add(partida.destination);
      }
    });
    return Array.from(set);
  }, [partidas]);

  return (
    <form
      ref={containerRef}
      className="space-y-4"
      onKeyDown={handleEnterFocus}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AutocompleteControlled
          name="destination"
          control={control}
          label="Destino"
          size="small"
          options={destinationOptions}
          getOptionLabel={(option) => option}
          autoAdvance
        />
        <TextControlled
          name="productId"
          control={control}
          label="ID de producto"
          placeholder="1234"
          size="small"
          inputProps={{ inputMode: "numeric" }}
        />
        <TextControlled
          name="pointName"
          control={control}
          label="Punto de partida"
          placeholder="Ej: Plaza Mayor"
          size="small"
          required
        />
        <TextControlled
          name="region"
          control={control}
          label="Región"
          placeholder="Ej: Cusco"
          size="small"
        />
      </div>
      <TextControlled
        name="horaPartida"
        control={control}
        label="Hora de partida"
        placeholder="HH:MM"
        size="small"
      />
    </form>
  );
}
