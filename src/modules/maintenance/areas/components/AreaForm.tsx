import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Plus, Trash2 } from "lucide-react";

import { TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import type { Area } from "@/types/maintenance";

type AreaFormProps = {
  initialData?: Partial<Area>;
  mode: "create" | "edit";
  onSave: (data: Area) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
};

type AreaFormValues = {
  area: string;
};

const buildDefaults = (data?: Partial<Area>): AreaFormValues => ({
  area: data?.area ?? "",
});

const normalizePayload = (values: AreaFormValues, id?: number): Area => ({
  id: id ?? 0,
  area: values.area?.trim().toUpperCase() ?? "",
});

export default function AreaForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: AreaFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);
  const [formKey, setFormKey] = useState(0);

  const form = useForm<AreaFormValues>({
    defaultValues: defaults,
  });

  const { handleSubmit, reset, control } = form;

  useEffect(() => {
    reset(defaults);
    focusFirstInput(containerRef.current);
  }, [defaults, reset]);

  const submit = async (values: AreaFormValues) => {
    const payload = normalizePayload(values, initialData?.id as number | undefined);
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
          {mode === "create" ? "Crear área" : "Editar área"}
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

      <div className="bg-white rounded-2xl shadow border border-slate-100 p-5 space-y-4">
        <TextControlled
          name="area"
          control={control}
          label="Nombre del área"
          placeholder="Ingrese área"
          required
          size="small"
          inputProps={{ "data-focus-first": "true" }}
        />
      </div>
    </form>
  );
}
