import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useForm, type UseFormReturn, useWatch } from "react-hook-form";

import { SelectControlled, TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import type { ActividadAdi, Product } from "@/types/maintenance";
import type { ActividadAdiRequest } from "../actividadesAdi.api";

export type ActividadFormValues = {
  productoId: string;
  actividad: string;
  precio: string;
  entrada: string;
  precioDol: string;
  entradaDol: string;
};

type ActividadFormDialogProps = {
  formRef: MutableRefObject<UseFormReturn<ActividadFormValues> | null>;
  initialData?: ActividadAdi;
  products: Product[];
};

const normalizeText = (value?: string) => value?.trim().toLowerCase() ?? "";

const findProductIdByDestino = (destino?: string, products: Product[] = []) => {
  if (!destino?.trim()) return undefined;
  const normalizedDestino = normalizeText(destino);
  const match = products.find((product) => {
    const label = product.descripcion || product.codigo || Producto;
    return normalizeText(label) === normalizedDestino;
  });
  return match?.id;
};

const buildDefaults = (
  data?: ActividadAdi,
  products: Product[] = [],
): ActividadFormValues => {
  const resolvedId =
    data?.idProducto ?? findProductIdByDestino(data?.destino, products) ?? 0;
  return {
    productoId: resolvedId ? resolvedId.toString() : "",
    actividad: data?.actividad ?? "",
    precio: data?.precioSol?.toString() ?? "",
    entrada: data?.entradaSol?.toString() ?? "",
    precioDol: data?.precioDol?.toString() ?? "",
    entradaDol: data?.entradaDol?.toString() ?? "",
  };
};

const buildProductOptions = (products: Product[]) => {
  const mapped = products.map((product) => {
    const label = product.descripcion || product.codigo || Producto;
    return { value: String(product.id), label };
  });
  return [{ value: "", label: "Selecciona un destino" }, ...mapped];
};

const parseNumber = (value?: string | number) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveProductId = (
  values: ActividadFormValues,
  initialData?: ActividadAdi,
) => {
  const fromValues = Number(values.productoId);
  if (Number.isFinite(fromValues) && fromValues > 0) return fromValues;
  if (initialData?.idProducto) return initialData.idProducto;
  return 0;
};

export const buildActividadPayload = (
  values: ActividadFormValues,
  selectedProduct?: Product,
  initialData?: ActividadAdi,
): ActividadAdiRequest => ({
  idActi: initialData?.id,
  actividades: values.actividad,
  precio: parseNumber(values.precio),
  entrada: parseNumber(values.entrada),
  precioDol: parseNumber(values.precioDol),
  entradaDol: parseNumber(values.entradaDol),
  region: selectedProduct?.region ?? initialData?.region ?? "",
  idProducto: resolveProductId(values, initialData),
});

export default function ActividadFormDialog({
  formRef,
  initialData,
  products,
}: ActividadFormDialogProps) {
  const defaults = useMemo(
    () => buildDefaults(initialData, products),
    [initialData, products],
  );
  const form = useForm<ActividadFormValues>({
    defaultValues: defaults,
  });
  const { control, reset } = form;
  const containerRef = useRef<HTMLDivElement>(null);

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

  const productOptions = useMemo(
    () => buildProductOptions(products),
    [products],
  );

  const selectedProductId = useWatch({
    control,
    name: "productoId",
  });

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === selectedProductId),
    [products, selectedProductId],
  );

  return (
    <form
      ref={containerRef}
      className="space-y-4 gap-4"
      onKeyDown={handleEnterFocus}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="mt-1">
        {" "}
        <SelectControlled
          name="productoId"
          control={control}
          label="Destino"
          size="small"
          options={productOptions}
          required
        />
      </div>
      <div className="mt-1">
        <TextControlled
          name="actividad"
          control={control}
          label="Actividad"
          size="small"
          className="mt-3"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TextControlled
          name="precio"
          control={control}
          label="Precio Sol"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />
        <TextControlled
          name="entrada"
          control={control}
          label="Entrada Sol"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />
        <TextControlled
          name="precioDol"
          control={control}
          label="Precio Dol"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />
        <TextControlled
          name="entradaDol"
          control={control}
          label="Entrada Dol"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />
      </div>
    </form>
  );
}
