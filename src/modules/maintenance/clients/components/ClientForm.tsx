import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Save, Plus, Trash2 } from "lucide-react";

import {
  DateInput,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import {
  formatDateForInput,
  getTodayDateInputValue,
} from "@/shared/helpers/formatDate";
import { useDialogStore } from "@/app/store/dialogStore";
import type { Client } from "@/types/maintenance";

type ClientFormProps = {
  initialData?: Partial<Client>;
  mode: "create" | "edit";
  onSave: (data: Client) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
};

const buildDefaults = (data?: Partial<Client>): Client => ({
  id: data?.id ?? data?.clienteId ?? 0,
  clienteId: data?.clienteId ?? data?.id ?? 0,
  clienteRazon: data?.clienteRazon ?? "",
  clienteRuc: data?.clienteRuc ?? "",
  clienteDni: data?.clienteDni ?? "",
  clienteDireccion: data?.clienteDireccion ?? "",
  clienteMovil: data?.clienteMovil ?? "",
  clienteTelefono: data?.clienteTelefono ?? "",
  clienteCorreo: data?.clienteCorreo ?? "",
  clienteEstado: data?.clienteEstado ?? "ACTIVO",
  clienteDespacho: data?.clienteDespacho ?? "",
  clienteUsuario: data?.clienteUsuario ?? "",
  clienteFecha:
    formatDateForInput(data?.clienteFecha) || getTodayDateInputValue(),
  companiaId: data?.companiaId ?? 1,
});

const estadoOptions = [
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
];

export default function ClientForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: ClientFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const openDialog = useDialogStore((s) => s.openDialog);

  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);

  const form = useForm<Client>({
    defaultValues: defaults,
  });

  const { handleSubmit, control, reset } = form;

  useEffect(() => {
    reset(buildDefaults(initialData));
    focusFirstInput(formRef.current);
  }, [initialData, reset]);

  const companyOptions = useMemo(() => {
    const base = [{ value: 1, label: "Compania 1" }];
    if (
      initialData?.companiaId &&
      !base.some((c) => Number(c.value) === Number(initialData.companiaId))
    ) {
      return [
        {
          value: Number(initialData.companiaId),
          label: `Compania ${initialData.companiaId}`,
        },
        ...base,
      ];
    }
    return base;
  }, [initialData?.companiaId]);

  const submit = async (values: Client) => {
    const payload: Client = {
      ...values,
      clienteRazon: values.clienteRazon?.trim().toUpperCase() ?? "",
      clienteRuc: values.clienteRuc?.trim() ?? "",
      clienteDni: values.clienteDni?.trim() ?? "",
      clienteDireccion: values.clienteDireccion?.trim() ?? "",
      clienteMovil: values.clienteMovil?.trim() ?? "",
      clienteTelefono: values.clienteTelefono?.trim() ?? "",
      clienteCorreo: values.clienteCorreo?.trim() ?? "",
      clienteDespacho: values.clienteDespacho?.trim() ?? "",
      clienteUsuario: values.clienteUsuario?.trim() ?? "",
      clienteEstado: values.clienteEstado ?? "ACTIVO",
      clienteFecha: values.clienteFecha ?? "",
      companiaId: Number(values.companiaId) || 1,
      clienteId: Number(values.clienteId) || 0,
      id: Number(values.clienteId) || (values.id ?? 0),
    };

    await onSave(payload);

    if (mode === "create") {
      reset(buildDefaults());
      onNew?.();
      focusFirstInput(formRef.current);
    }
  };

  const handleNew = () => {
    reset(buildDefaults());
    onNew?.();
    focusFirstInput(formRef.current);
  };

  const handleDeleteConfirm = () => {
    if (!onDelete) return;

    openDialog({
      title: "Eliminar cliente",
      size: "sm",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        await onDelete();
      },
      content: () => (
        <p className="text-sm text-slate-700">
          Estas seguro de eliminar este cliente?
          <br />
          Esta accion no se puede deshacer.
        </p>
      ),
    });
  };

  return (
    <div ref={formRef} className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit(submit)} onKeyDown={handleEnterFocus}>
          <div className="bg-[#E8612A] text-white px-4 py-3 flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create" ? "Registrar cliente" : "Editar cliente"}
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
              {mode !== "edit" && (
                <button
                  type="button"
                  onClick={handleNew}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                  title="Nuevo"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>
              )}
              {mode === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextControlled
                name="clienteRazon"
                control={control}
                label="Razon social"
                required
                size="small"
                inputProps={{ "data-focus-first": "true" }}
              />

              <TextControlled
                name="clienteRuc"
                control={control}
                label="RUC"
                size="small"
                inputProps={{ maxLength: 11 }}
              />

              <TextControlled
                name="clienteDni"
                control={control}
                label="DNI"
                size="small"
                inputProps={{ maxLength: 8 }}
              />

              <TextControlled
                name="clienteDireccion"
                control={control}
                label="Direccion"
                size="small"
              />

              <TextControlled
                name="clienteMovil"
                control={control}
                label="Movil"
                size="small"
              />

              <TextControlled
                name="clienteTelefono"
                control={control}
                label="Telefono"
                size="small"
              />

              <TextControlled
                name="clienteCorreo"
                control={control}
                label="Correo"
                size="small"
              />

              <TextControlled
                name="clienteUsuario"
                control={control}
                label="Usuario"
                size="small"
              />

              <DateInput
                name="clienteFecha"
                control={control}
                label="Fecha"
                size="small"
              />

              <SelectControlled
                name="clienteEstado"
                control={control}
                label="Estado"
                options={estadoOptions}
                size="small"
                disabled={mode === "create"}
                autoAdvance
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
