import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";

import { AutocompleteControlled, TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { DeparturePoint } from "@/types/maintenance";
import { serviciosDB } from "@/app/db/serviciosDB";
import TimePickerControlled from "@/components/ui/inputs/TimePickerControlled";

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

  const { control, reset, setValue } = form;
  const [productOptions, setProductOptions] = useState<
    { id: number; nombre: string }[]
  >([]);

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
    productOptions.forEach((product) => {
      if (product.nombre) {
        set.add(product.nombre);
      }
    });
    return Array.from(set);
  }, [partidas, productOptions]);
  const destinationValue = useWatch({
    control,
    name: "destination",
  });

  useEffect(() => {
    let canceled = false;
    serviciosDB.productos
      .toArray()
      .then((items) => {
        if (canceled) return;
        setProductOptions(items);
      })
      .catch((err) => {
        console.error("Error loading productos", err);
      });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!destinationValue) {
      setValue("productId", "");
      return;
    }
    const match = productOptions.find(
      (product) => product.nombre === destinationValue,
    );
    if (match) {
      setValue("productId", String(match.id));
    }
  }, [destinationValue, productOptions, setValue]);

  return (
    <form
      ref={containerRef}
      className="space-y-4"
      onKeyDown={handleEnterFocus}
      onSubmit={(event) => event.preventDefault()}
    >
      <AutocompleteControlled
        name="destination"
        control={control}
        label="Destino"
        size="small"
        options={destinationOptions}
        getOptionLabel={(option) => option}
        autoAdvance
      />

      <div className=" mb-2">
        <TextControlled
          name="pointName"
          control={control}
          label="Punto de partida"
          placeholder="Ej: Plaza Mayor"
          size="small"
          required
          transform={(v) => v.toUpperCase()}
          disableHistory
        />
      </div>

      <TimePickerControlled
        name="horaPartida"
        control={control}
        label="Hora de partida"
        size="small"
      />
    </form>
  );
}
