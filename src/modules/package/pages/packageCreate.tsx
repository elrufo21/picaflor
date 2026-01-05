import { useForm } from "react-hook-form";
import { usePackageStore } from "../store/packageStore";

type FormValues = {
  destino: string;
  fecha: string;
  cantTotalPax: number;
  cantMaxPax: number;
  disponibles: number;
  estado: string;
  verListadoUrl?: string;
};

const PackageCreate = () => {
  const addPackage = usePackageStore((state) => state.addPackage);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      destino: "",
      fecha: new Date().toISOString().slice(0, 10),
      cantTotalPax: 0,
      cantMaxPax: 0,
      disponibles: 0,
      estado: "BLOQUEADO",
      verListadoUrl: "#",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    addPackage(values);
    reset();
  });

  return (
    <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h1 className="text-xl font-semibold text-slate-900">Nuevo Paquete</h1>
      <p className="text-sm text-slate-600 mt-1">
        Completa los datos y guarda para agregarlo al listado.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-800">Destino</label>
          <input
            {...register("destino", { required: "Ingresa un destino" })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="FULL DAY PARACAS - ICA"
          />
          {errors.destino && (
            <span className="text-xs text-rose-600">
              {errors.destino.message}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-800">Fecha</label>
            <input
              type="date"
              {...register("fecha", { required: "Ingresa la fecha" })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.fecha && (
              <span className="text-xs text-rose-600">
                {errors.fecha.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-800">Estado</label>
            <select
              {...register("estado")}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="BLOQUEADO">Bloqueado</option>
              <option value="DISPONIBLE">Disponible</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            label="CanTotalPax"
            error={errors.cantTotalPax?.message}
            {...register("cantTotalPax", {
              valueAsNumber: true,
              min: { value: 0, message: "Debe ser >= 0" },
            })}
          />
          <NumberField
            label="CantMaxPax"
            error={errors.cantMaxPax?.message}
            {...register("cantMaxPax", {
              valueAsNumber: true,
              min: { value: 0, message: "Debe ser >= 0" },
            })}
          />
          <NumberField
            label="Disponibles"
            error={errors.disponibles?.message}
            {...register("disponibles", {
              valueAsNumber: true,
              min: { value: 0, message: "Debe ser >= 0" },
            })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-800">
            Enlace listado (opcional)
          </label>
          <input
            {...register("verListadoUrl")}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="#"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors text-sm"
            disabled={isSubmitting}
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
};

type NumberFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const NumberField = ({ label, error, ...rest }: NumberFieldProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-slate-800">{label}</label>
    <input
      type="number"
      min={0}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      {...rest}
    />
    {error && <span className="text-xs text-rose-600">{error}</span>}
  </div>
);

export default PackageCreate;
