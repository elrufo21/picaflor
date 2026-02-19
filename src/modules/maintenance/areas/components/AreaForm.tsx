import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Plus, Trash2 } from "lucide-react";

import { TextControlled } from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import { useDialogStore } from "@/app/store/dialogStore";
import type { Area } from "@/types/maintenance";

type AreaFormProps = {
  initialData?: Partial<Area>;
  mode: "create" | "edit";
  onSave: (data: Area) => void | boolean | Promise<void | boolean>;
  onNew?: () => void;
  onDelete?: () => void;
  hideHeaderActions?: boolean;
  onRegisterSubmit?: (submit: (() => Promise<boolean>) | null) => void;
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
  hideHeaderActions = false,
  onRegisterSubmit,
}: AreaFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);
  const [formKey, setFormKey] = useState(0);
  const openDialog = useDialogStore((s) => s.openDialog);

  const form = useForm<AreaFormValues>({
    defaultValues: defaults,
  });

  const { handleSubmit, reset, control, trigger, getValues } = form;

  useEffect(() => {
    reset(defaults);
    focusFirstInput(containerRef.current);
  }, [defaults, reset]);

  const submit = useCallback(
    async (values: AreaFormValues): Promise<boolean> => {
      const payload = normalizePayload(
        values,
        initialData?.id as number | undefined,
      );
      const ok = await onSave(payload);
      if (ok === false) return false;

      if (mode === "create") {
        reset(buildDefaults());
        onNew?.();
        setFormKey((k) => k + 1);
        focusFirstInput(containerRef.current);
      }

      return true;
    },
    [initialData?.id, mode, onSave, onNew, reset],
  );

  const submitFromOutside = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) return false;
    return submit(getValues());
  }, [trigger, submit, getValues]);

  useEffect(() => {
    if (!onRegisterSubmit) return;
    onRegisterSubmit(submitFromOutside);
    return () => onRegisterSubmit(null);
  }, [onRegisterSubmit, submitFromOutside]);

  const handleNew = () => {
    reset(buildDefaults());
    onNew?.();
    setFormKey((k) => k + 1);
    focusFirstInput(containerRef.current);
  };

  const handleDelete = () => {
    if (!onDelete) return;

    openDialog({
      title: "Eliminar area",
      size: "sm",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        await onDelete();
      },
      content: () => (
        <p className="text-sm text-slate-700">
          Estas seguro de eliminar esta area?
          <br />
          Esta accion no se puede deshacer.
        </p>
      ),
    });
  };

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit(submit)}
      onKeyDown={handleEnterFocus}
      className="space-y-4"
      key={formKey}
    >
      {!hideHeaderActions && (
        <div className="bg-[#E8612A] text-white px-4 py-3 rounded-2xl flex items-center justify-between">
          <h1 className="text-base font-semibold">
            {mode === "create" ? "Crear area" : "Editar area"}
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
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-slate-100 p-5 space-y-4">
        <TextControlled
          name="area"
          control={control}
          label="Nombre del area"
          placeholder="Ingrese area"
          required
          size="small"
          inputProps={{ "data-focus-first": "true" }}
          disabled={mode === "edit"}
          disableHistory
        />
      </div>
    </form>
  );
}
