import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Plus, Trash2 } from "lucide-react";

import { TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import type { Category } from "@/types/maintenance";

type CategoryFormProps = {
  initialData?: Partial<Category>;
  mode: "create" | "edit";
  onSave: (data: Category) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
};

type CategoryFormValues = {
  nombreSublinea: string;
  codigoSunat: string;
};

const buildDefaults = (data?: Partial<Category>): CategoryFormValues => ({
  nombreSublinea: data?.nombreSublinea ?? "",
  codigoSunat: data?.codigoSunat ?? "",
});

const normalizePayload = (
  values: CategoryFormValues,
  id?: number | string
): Category => ({
  id: Number(id ?? 0),
  nombreSublinea: values.nombreSublinea?.trim().toUpperCase() ?? "",
  codigoSunat: values.codigoSunat?.trim().toUpperCase() ?? "",
  idSubLinea: Number(id ?? 0) || undefined,
  nombre: values.nombreSublinea?.trim() ?? "",
});

export default function CategoryForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: CategoryFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);
  const [formKey, setFormKey] = useState(0);

  const form = useForm<CategoryFormValues>({
    defaultValues: defaults,
  });

  const { handleSubmit, control, reset } = form;

  useEffect(() => {
    reset(defaults);
    focusFirstInput(containerRef.current);
  }, [defaults, reset]);

  const submit = async (values: CategoryFormValues) => {
    const payload = normalizePayload(
      values,
      initialData?.id ?? initialData?.idSubLinea
    );
    await onSave(payload);
    if (mode === "create") {
      reset(buildDefaults());
      onNew?.();
      setFormKey((k) => k + 1);
      focusFirstInput(containerRef.current);
    }
  };

  const handleNew = () => {
    reset(buildDefaults());
    onNew?.();
    setFormKey((k) => k + 1);
    focusFirstInput(containerRef.current);
  };

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit(submit)}
      className="space-y-4"
      key={formKey}
    >
      <div className="bg-[#B23636] text-white px-4 py-3 rounded-2xl flex items-center justify-between">
        <h1 className="text-base font-semibold">
          {mode === "create" ? "Crear categoría" : "Editar categoría"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
            title="Guardar"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Guardar</span>
          </button>
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
            title="Nuevo"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
          {mode === "edit" && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow border   border-slate-100 p-5 space-y-4">
        <div>
          {" "}
          <TextControlled
            name="nombreSublinea"
            control={control}
            label="Nombre de categoría"
            placeholder="Ingrese nombre"
            required
            size="small"
            inputProps={{ "data-focus-first": "true" }}
          />
        </div>
        <div className="mt-4">
          {" "}
          <TextControlled
            name="codigoSunat"
            control={control}
            label="Código SUNAT"
            placeholder="Ingrese código SUNAT"
            size="small"
          />
        </div>
      </div>
    </form>
  );
}
