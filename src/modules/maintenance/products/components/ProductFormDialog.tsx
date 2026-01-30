import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import {
  RadioGroupControlled,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import type { Product } from "@/types/maintenance";
import { useHotelRegions } from "@/modules/maintenance/hotels/useHotelRegions";
import { useProductSublineas } from "../useProductSublineas";
import type { ProductPayload } from "../products.api";
import type { ProductSublinea } from "../sublineas.api";

export type ProductFormValues = {
  categoria: string;
  region: string;
  codigo: string;
  descripcion: string;
  preCosto: string;
  ventaSoles: string;
  ventaDolar: string;
  aplicaINV: string;
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

const buildDefaults = (data?: Partial<Product>): ProductFormValues => ({
  categoria: data?.categoria ?? "",
  region: data?.region ?? "",
  codigo: data?.codigo ?? "",
  descripcion: data?.descripcion ?? "",
  preCosto: data?.preCosto?.toString() ?? "",
  ventaSoles: data?.ventaSoles?.toString() ?? "",
  ventaDolar: data?.ventaDolar?.toString() ?? "",
  aplicaINV: data?.aplicaINV ?? "SERVICIO",
  cantidad: data?.cantidad?.toString() ?? "",
  cantMaxPax: data?.cantMaxPax?.toString() ?? "",
  visitasExCur: data?.visitasExCur ?? "",
  usuario: data?.usuario ?? "",
  estado: data?.estado ?? "BUENO",
});

const estadoOptions = [
  { value: "BUENO", label: "Bueno" },
  { value: "DESCONTINUADO", label: "Descontinuado" },
];

const aplicaInvOptions = [
  { value: "SERVICIO", label: "Servicio" },
  { value: "BIEN", label: "Bien" },
];

export default function ProductFormDialog({
  formRef,
  initialData,
}: ProductFormDialogProps) {
  const { data: sublineas = [], isLoading: loadingSublineas } =
    useProductSublineas();
  const { data: regions = [], isLoading: loadingRegions } = useHotelRegions();
  const containerRef = useRef<HTMLDivElement>(null);
  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);
  const form = useForm<ProductFormValues>({
    defaultValues: defaults,
  });

  const { control, reset } = form;
  const [codeEditable, setCodeEditable] = useState(
    Boolean(initialData?.codigo),
  );

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

  useEffect(() => {
    setCodeEditable(Boolean(initialData?.codigo));
  }, [initialData?.codigo]);

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

  const toggleCodeEditing = () => setCodeEditable((prev) => !prev);

  return (
    <form
      ref={containerRef}
      className="space-y-4"
      onKeyDown={handleEnterFocus}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectControlled
          name="categoria"
          control={control}
          label="Categoría"
          size="small"
          required
          options={categoryOptions}
          helperText={loadingSublineas ? "Cargando categorías..." : undefined}
          disabled={loadingSublineas && categoryOptions.length <= 1}
        />
        <SelectControlled
          name="region"
          control={control}
          label="Región"
          size="small"
          options={regionOptions}
          required
          helperText={loadingRegions ? "Cargando regiones..." : undefined}
          disabled={loadingRegions && !regionOptions.length}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex gap-2 items-center">
        <TextControlled
          name="codigo"
          control={control}
          label="Código"
          placeholder="Autogenerado"
          size="small"
          disabled={!codeEditable}
          className="flex-1"
        />
        <button
          type="button"
          onClick={toggleCodeEditing}
          className="text-xs font-semibold text-sky-600 hover:text-sky-800 whitespace-nowrap"
        >
          {codeEditable ? "Bloquear" : "Editar"}
        </button>
      </div>
        <TextControlled
          name="descripcion"
          control={control}
          label="Descripción"
          placeholder="Descripción del producto"
          size="small"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextControlled
          name="preCosto"
          control={control}
          label="Pre costo"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />
        <TextControlled
          name="ventaSoles"
          control={control}
          label="Venta S/."
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />
        <TextControlled
          name="ventaDolar"
          control={control}
          label="Venta USD"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectControlled
          name="estado"
          control={control}
          label="Estado"
          size="small"
          options={estadoOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextControlled
          name="cantidad"
          control={control}
          label="Cantidad"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "1" }}
        />
        <TextControlled
          name="cantMaxPax"
          control={control}
          label="Cant. máximo pax"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "1" }}
        />
      </div>

      <TextControlled
        name="visitasExCur"
        control={control}
        label="Visitas / excursiones / ruta"
        size="small"
        multiline
        rows={3}
        placeholder="Describir visitas o rutas complementarias"
      />

      <div className="mt-4">
        {" "}
        <TextControlled
          name="usuario"
          control={control}
          label="Usuario"
          size="small"
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
    idProducto: initialData?.id ?? 0,
    idSubLinea: resolveSublineaId(resolvedLabel, sublineas),
    ProductoCodigo: values.codigo || initialData?.codigo || "",
    ProductoNombre: values.descripcion || initialData?.descripcion || "",
    ProductoTipoCambio: 0,
    ProductoCostoDolar: 0,
    ProductoUM: "UNIDAD",
    ProductoCosto: parseNumber(values.preCosto || initialData?.precio),
    ProductoVenta: parseNumber(values.ventaSoles || initialData?.ventaSoles),
    ProductoVentaB: parseNumber(values.ventaDolar),
    ProductoCantidad: parseNumber(values.cantidad || initialData?.cantidad),
    ProductoEstado: values.estado || initialData?.estado || "BUENO",
    ProductoUsuario: popularUsuario,
    ProductoFecha: new Date().toISOString(),
    ProductoImagen: "-",
    ValorCritico: 1,
    AplicaTC: "N",
    AplicaINV: values.aplicaINV === "BIEN" ? "S" : "N",
    CompaniaId: 1,
    VisitasExCur: values.visitasExCur || initialData?.visitasExCur || "",
    CantMaxPAX: parseNumber(values.cantMaxPax || initialData?.cantMaxPax),
    Region: computedRegion,
  };
};
