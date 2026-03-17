import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { SelectControlled, TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import type { Product } from "@/types/maintenance";
import { useHotelRegions } from "@/modules/maintenance/hotels/useHotelRegions";
import { useProductSublineas } from "../useProductSublineas";
import type { ProductPayload } from "../products.api";
import type { ProductSublinea } from "../sublineas.api";
import { useAuthStore } from "@/store/auth/auth.store";

export type ProductFormValues = {
  categoria: string;
  region: string;
  codigo: string;
  productoNombre: string;
  preCosto: string;
  ventaSoles: string;
  ventaDolar: string;
  cantidad: string;
  cantMaxPax: string;
  visitasExCur: string;
  usuario: string;
  estado: string;
};

type ProductFormDialogProps = {
  formRef: MutableRefObject<UseFormReturn<ProductFormValues> | null>;
  initialData?: Partial<Product>;
};

const buildDefaults = (
  data?: Partial<Product>,
  defaultUsuario?: string,
): ProductFormValues => ({
  categoria: data?.categoria ?? "",
  region: data?.region ?? "",
  codigo: data?.codigo ?? "",
  productoNombre: data?.descripcion ?? "",
  preCosto: data?.preCosto?.toString() ?? "",
  ventaSoles: data?.ventaSoles?.toString() ?? "",
  ventaDolar: data?.ventaDolar?.toString() ?? "",
  cantidad: data?.cantidad?.toString() ?? "",
  cantMaxPax: data?.cantMaxPax?.toString() ?? "",
  visitasExCur: data?.visitasExCur ?? "",
  usuario: data?.usuario ?? defaultUsuario ?? "",
  estado: data?.estado ?? "BUENO",
});

const estadoOptions = [
  { value: "BUENO", label: "Bueno" },
  { value: "DESCONTINUADO", label: "Descontinuado" },
];

export default function ProductFormDialog({
  formRef,
  initialData,
}: ProductFormDialogProps) {
  const { data: sublineas = [], isLoading: loadingSublineas } =
    useProductSublineas();
  const { data: regions = [], isLoading: loadingRegions } = useHotelRegions();
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultUsuario = useMemo(() => {
    const trimmedDisplayName = user?.displayName?.trim();
    return trimmedDisplayName || user?.username || "";
  }, [user?.displayName, user?.username]);
  const defaults = useMemo(
    () => buildDefaults(initialData, defaultUsuario),
    [initialData, defaultUsuario],
  );
  const form = useForm<ProductFormValues>({
    defaultValues: defaults,
  });

  const { control, reset, setValue } = form;
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

  const categoryOptions = useMemo(() => {
    const mapped = sublineas.map((item) => {
      const label = item.nombreSublinea ?? `Sublinea ${item.id}`;
      return { value: label, label };
    });
    return [{ value: "", label: "Selecciona una categoría" }, ...mapped];
  }, [sublineas]);

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
    return [{ value: "", label: "Selecciona una región" }, ...mapped];
  }, [regions, defaults.region]);

  useEffect(() => {
    if (initialData?.codigo) {
      return;
    }
    if (form.getValues("codigo")) {
      return;
    }
    const generated = `PR-${Math.floor(Math.random() * 9000) + 1000}`;
    setValue("codigo", generated);
  }, [form, initialData?.codigo, setValue]);
  return (
    <form
      ref={containerRef}
      className="space-y-6"
      onKeyDown={handleEnterFocus}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SelectControlled
          name="categoria"
          control={control}
          label="Categoría"
          InputLabelProps={{ shrink: true }}
          size="small"
          required
          options={categoryOptions}
          helperText={loadingSublineas ? "Cargando categorías..." : undefined}
          disabled={loadingSublineas && categoryOptions.length <= 1}
          autoAdvance
        />

        <SelectControlled
          name="region"
          control={control}
          label="Región"
          InputLabelProps={{ shrink: true }}
          size="small"
          required
          options={regionOptions}
          helperText={loadingRegions ? "Cargando regiones..." : undefined}
          disabled={loadingRegions && !regionOptions.length}
          autoAdvance
          data-focus-next='input[data-focus-target="producto-nombre"]'
        />
      </div>

      {/* 📝 DESCRIPCIÓN */}
      <TextControlled
        transform={(value) => value.toUpperCase()}
        name="productoNombre"
        control={control}
        label="Producto"
        placeholder="Descripción del producto"
        size="small"
        inputProps={{ "data-focus-target": "producto-nombre" }}
        disableHistory
      />

      {/* 💰 PRECIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <TextControlled
          transform={(value) => value.toUpperCase()}
          name="ventaSoles"
          control={control}
          label="Venta (S/.)"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />

        <TextControlled
          transform={(value) => value.toUpperCase()}
          name="ventaDolar"
          control={control}
          label="Venta (USD)"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          disableHistory
        />
      </div>

      <div className="mt-2">
        <TextControlled
          transform={(value) => value.toUpperCase()}
          name="visitasExCur"
          control={control}
          label="Visitas / excursiones / ruta"
          size="small"
          multiline
          rows={3}
          placeholder="Describe las visitas, excursiones o rutas incluidas"
          disableHistory
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {" "}
        <SelectControlled
          name="estado"
          control={control}
          label="Estado"
          size="small"
          options={estadoOptions}
          disabled={!initialData?.id}
        />
        <TextControlled
          transform={(value) => value.toUpperCase()}
          name="usuario"
          control={control}
          label="Usuario responsable"
          size="small"
          disableHistory
          disabled
        />
      </div>
    </form>
  );
}

const parseNumber = (value?: string | number) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveSublineaId = (
  label: string | undefined,
  list: ProductSublinea[] = [],
): number => {
  if (!label) return 0;
  const match = list.find((item) => {
    const name = item.nombreSublinea ?? `Sublinea ${item.id}`;
    return name === label;
  });
  const value = match?.id ?? "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildProductPayload = (
  values: ProductFormValues,
  usuario: string,
  initialData?: Partial<Product>,
  sublineas: ProductSublinea[] = [],
): ProductPayload => {
  const popularUsuario = usuario || "sistema";
  const computedRegion = values.region || initialData?.region || "";
  const resolvedLabel = values.categoria || initialData?.categoria || "";
  return {
    IdProducto: initialData?.id ?? 0,
    IdSubLinea: resolveSublineaId(resolvedLabel, sublineas),
    ProductoCodigo: values.codigo || initialData?.codigo || "",
    ProductoNombre: values.productoNombre || initialData?.descripcion || "",
    ProductoTipoCambio: parseNumber(initialData?.tipoCambio),
    ProductoCostoDolar: parseNumber(initialData?.costoDolar),
    ProductoUM: initialData?.unidadM || initialData?.unidad || "UNIDAD",
    ProductoCosto: parseNumber(
      values.preCosto || initialData?.preCosto || initialData?.precio,
    ),
    ProductoVenta: parseNumber(values.ventaSoles || initialData?.ventaSoles),
    ProductoVentaB: parseNumber(values.ventaDolar),
    ProductoCantidad: parseNumber(values.cantidad || initialData?.cantidad),
    ProductoEstado: values.estado || initialData?.estado || "BUENO",
    ProductoUsuario: popularUsuario,
    ProductoImagen: "-",
    CompaniaId: 1,
    VisitasExCur: values.visitasExCur || initialData?.visitasExCur || "",
    CantMaxPAX: parseNumber(values.cantMaxPax || initialData?.cantMaxPax),
    Region: computedRegion,
  };
};
