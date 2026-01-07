import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";

import DataTable from "./DataTable";
import {
  AutocompleteControlled,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useEmployeesStore } from "@/store/employees/employees.store";
import { useUsersStore } from "@/store/users/users.store";
import { useDialogStore } from "@/app/store/dialogStore"; // 👈 SOLO ESTO SE AGREGA

interface UserFormBaseProps {
  initialData?: Partial<any>;
  mode: "create" | "edit";
  onSave: (data: any) => Promise<boolean> | boolean;
  onNew?: () => void;
  onDelete?: () => void;
  onSelectUser?: (user: any) => void;
}

type Option = { label: string; value: number | string; data?: any };

type UserFormValues = {
  PersonalId: Option | null;
  UsuarioAlias: string;
  UsuarioClave: string;
  ConfirmClave: string;
  UsuarioEstado: string;
  UsuarioSerie: string;
  EnviaBoleta: number;
  EnviarFactura: number;
  EnviaNC: number;
  EnviaND: number;
  Administrador: number;
};

const yesNoOptions = [
  { value: 1, label: "Sí" },
  { value: 0, label: "No" },
];

const estadoOptions = [
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
];

export default function UserFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
  onSelectUser,
}: UserFormBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { users, fetchUsers } = useUsersStore();
  const { employees, fetchEmployees } = useEmployeesStore();

  const openDialog = useDialogStore((s) => s.openDialog); // 👈 SOLO ESTO

  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [usersEstado, setUsersEstado] = useState<"ACTIVO" | "INACTIVO">(
    "ACTIVO"
  );

  const emptyValues: UserFormValues = {
    PersonalId: null,
    UsuarioAlias: "",
    UsuarioClave: "",
    ConfirmClave: "",
    UsuarioEstado: "ACTIVO",
    UsuarioSerie: "B001",
    EnviaBoleta: 0,
    EnviarFactura: 0,
    EnviaNC: 0,
    EnviaND: 0,
    Administrador: 0,
  };

  const employeeOptions = useMemo<Option[]>(
    () =>
      employees.map((p) => ({
        label:
          `${p.personalNombres ?? ""} ${p.personalApellidos ?? ""}`.trim() ||
          p.personalCodigo ||
          `Personal ${p.personalId}`,
        value: p.personalId,
        data: p,
      })),
    [employees]
  );

  const form = useForm<UserFormValues>({
    defaultValues: emptyValues,
  });

  const { handleSubmit, control, reset, setValue } = form;

  const mapInitialData = (data?: Partial<any>): UserFormValues => {
    if (!data) return emptyValues;
    const personalId = data.PersonalId ?? data.personalId ?? null;
    const personalOpt =
      employeeOptions.find((opt) => Number(opt.value) === Number(personalId)) ??
      null;
    return {
      PersonalId: personalOpt,
      UsuarioAlias: data.UsuarioAlias ?? "",
      UsuarioClave: data.UsuarioClave ?? "",
      ConfirmClave: data.UsuarioClave ?? "",
      UsuarioEstado: data.UsuarioEstado ?? "ACTIVO",
      UsuarioSerie: data.UsuarioSerie ?? "B001",
      EnviaBoleta: Number(data.EnviaBoleta ?? 0),
      EnviarFactura: Number(data.EnviarFactura ?? 0),
      EnviaNC: Number(data.EnviaNC ?? 0),
      EnviaND: Number(data.EnviaND ?? 0),
      Administrador: Number(data.Administrador ?? 0),
    };
  };

  useEffect(() => {
    fetchUsers(usersEstado);
  }, [fetchUsers, usersEstado]);

  useEffect(() => {
    if (!employees.length) {
      fetchEmployees();
    }
  }, [employees.length, fetchEmployees]);

  useEffect(() => {
    reset(mapInitialData(mode === "create" ? undefined : initialData));
    focusFirstInput(containerRef.current);
  }, [initialData, mode, reset, employeeOptions]);

  const onSubmit = async (values: UserFormValues) => {
    if ((values.UsuarioClave ?? "") !== (values.ConfirmClave ?? "")) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    const payload = {
      PersonalId: values.PersonalId ? Number(values.PersonalId.value) : 0,
      UsuarioAlias: values.UsuarioAlias?.trim() ?? "",
      UsuarioClave: values.UsuarioClave ?? "",
      UsuarioEstado: values.UsuarioEstado ?? "ACTIVO",
      UsuarioSerie: values.UsuarioSerie ?? "B001",
      EnviaBoleta: Number(values.EnviaBoleta ?? 0),
      EnviarFactura: Number(values.EnviarFactura ?? 0),
      EnviaNC: Number(values.EnviaNC ?? 0),
      EnviaND: Number(values.EnviaND ?? 0),
      Administrador: Number(values.Administrador ?? 0),
    };

    const ok = await onSave(payload);
    if (!ok) return;

    reset(emptyValues);
    onNew?.();
    focusFirstInput(containerRef.current);
  };

  const handleNew = () => {
    reset(emptyValues);
    onNew?.();
    focusFirstInput(containerRef.current);
  };

  const handleRowClick = (row: any) => {
    const personalOpt =
      employeeOptions.find(
        (opt) => Number(opt.value) === Number(row.PersonalId ?? row.personalId)
      ) ?? null;

    reset({
      PersonalId: personalOpt,
      UsuarioAlias: row.UsuarioAlias ?? "",
      UsuarioClave: row.UsuarioClave ?? "",
      ConfirmClave: row.UsuarioClave ?? "",
      UsuarioEstado: row.UsuarioEstado ?? "ACTIVO",
      UsuarioSerie: row.UsuarioSerie ?? "B001",
      EnviaBoleta: Number(row.EnviaBoleta ?? 0),
      EnviarFactura: Number(row.EnviarFactura ?? 0),
      EnviaNC: Number(row.EnviaNC ?? 0),
      EnviaND: Number(row.EnviaND ?? 0),
      Administrador: Number(row.Administrador ?? 0),
    });
    onSelectUser?.(row);
  };

  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor("UsuarioAlias", {
      header: "Usuario",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("area", {
      header: "Área",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("UsuarioEstado", {
      header: "Estado",
      cell: (info) => info.getValue(),
    }),
  ];

  return (
    <div ref={containerRef} className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-[#B23636] text-white px-4 py-3 flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create" ? "Crear Usuario" : "Editar Usuario"}
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
                  onClick={() =>
                    openDialog({
                      title: "Eliminar usuario",
                      size: "sm",
                      confirmLabel: "Eliminar",
                      cancelLabel: "Cancelar",
                      onConfirm: async () => {
                        await onDelete();
                      },
                      content: () => (
                        <p className="text-sm text-slate-700">
                          ¿Estás seguro de eliminar este usuario?
                          <br />
                          Esta acción no se puede deshacer.
                        </p>
                      ),
                    })
                  }
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
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[40%] space-y-4">
                <div className="mt-4">
                  <AutocompleteControlled
                    name="PersonalId"
                    control={control}
                    label="Personal"
                    placeholder="Buscar personal"
                    options={employeeOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(opt, val) =>
                      String(opt.value) === String(val.value)
                    }
                    onChange={(_, value) => setValue("PersonalId", value)}
                    required
                    size="small"
                    data-focus-next="input[name='UsuarioAlias']"
                  />
                </div>

                <div className="mt-4">
                  <TextControlled
                    name="UsuarioAlias"
                    control={control}
                    label="Usuario / Alias"
                    placeholder="ej: jramirez"
                    required
                    size="small"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s+/g, "");
                      e.target.value = value;
                    }}
                  />
                </div>

                <div className="mt-4">
                  <TextControlled
                    name="UsuarioClave"
                    control={control}
                    label="Contraseña"
                    type={showPass ? "text" : "password"}
                    placeholder="Ingrese contraseña"
                    required
                    size="small"
                  />
                </div>

                <div className="mt-4">
                  <TextControlled
                    name="ConfirmClave"
                    control={control}
                    label="Confirmar contraseña"
                    type={showPassConfirm ? "text" : "password"}
                    placeholder="Repita la contraseña"
                    required
                    size="small"
                  />
                </div>

                <div className="mt-4">
                  <SelectControlled
                    name="UsuarioEstado"
                    control={control}
                    label="Estado"
                    options={estadoOptions}
                    disabled={mode === "create"}
                    size="small"
                  />
                </div>
              </div>

              <div className="w-full md:w-[60%] mt-6 md:mt-0">
                <DataTable
                  columns={columns}
                  data={users}
                  filterKeys={["UsuarioAlias", "UsuarioEstado", "area"]}
                  onRowClick={handleRowClick}
                  renderFilters={
                    <select
                      value={usersEstado}
                      onChange={(e) =>
                        setUsersEstado(e.target.value as "ACTIVO" | "INACTIVO")
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="ACTIVO">Activos</option>
                      <option value="INACTIVO">Inactivos</option>
                    </select>
                  }
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
