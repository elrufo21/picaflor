import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";
import { IconButton, InputAdornment } from "@mui/material";

import DataTable from "./DataTable";
import {
  AutocompleteControlled,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { handleEnterFocus } from "@/shared/helpers/formFocus";
import { useEmployeesStore } from "@/store/employees/employees.store";
import { useUsersStore } from "@/store/users/users.store";
import { useDialogStore } from "@/app/store/dialogStore"; // óY'^ SOLO ESTO SE AGREGA

interface UserFormBaseProps {
  initialData?: Partial<any>;
  mode: "create" | "edit";
  onSave: (data: any) => Promise<boolean> | boolean;
  onNew?: () => void;
  onDelete?: () => void;
  onSelectUser?: (user: any) => void;
  passwordChangeOnly?: boolean;
  hideHeaderActions?: boolean;
  showUsersTable?: boolean;
  onRegisterSubmit?: (submit: (() => Promise<boolean>) | null) => void;
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

const passwordMinRules = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

export default function UserFormBase({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
  onSelectUser,
  passwordChangeOnly = false,
  hideHeaderActions = false,
  showUsersTable: showUsersTableProp,
  onRegisterSubmit,
}: UserFormBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { users, fetchUsers } = useUsersStore();
  const { employees, fetchEmployees } = useEmployeesStore();

  const openDialog = useDialogStore((s) => s.openDialog); // óY'^ SOLO ESTO

  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [usersEstado, setUsersEstado] = useState<"ACTIVO" | "INACTIVO">(
    "ACTIVO",
  );
  const showUsersTable = showUsersTableProp ?? !passwordChangeOnly;
  const lockIdentityFields = passwordChangeOnly;

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
    [employees],
  );

  const form = useForm<UserFormValues>({
    defaultValues: emptyValues,
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    trigger,
    getValues,
    setError,
    clearErrors,
    setFocus,
  } = form;

  const mapInitialData = (data?: Partial<any>): UserFormValues => {
    if (!data) return emptyValues;
    const personalId = data.PersonalId ?? data.personalId ?? null;
    const personalOpt =
      employeeOptions.find((opt) => Number(opt.value) === Number(personalId)) ??
      (personalId
        ? {
            value: Number(personalId),
            label: `Personal ${personalId}`,
          }
        : null) ??
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
    if (passwordChangeOnly || !showUsersTable) return;
    fetchUsers(usersEstado);
  }, [fetchUsers, usersEstado, passwordChangeOnly, showUsersTable]);

  useEffect(() => {
    if (!employees.length) {
      fetchEmployees();
    }
  }, [employees.length, fetchEmployees]);

  useEffect(() => {
    reset(mapInitialData(mode === "create" ? undefined : initialData));
    focusFirstInput(containerRef.current);
  }, [initialData, mode, reset, employeeOptions]);

  const onSubmit = useCallback(
    async (values: UserFormValues): Promise<boolean> => {
      clearErrors([
        "PersonalId",
        "UsuarioAlias",
        "UsuarioClave",
        "ConfirmClave",
      ]);
      const personalId = values.PersonalId
        ? Number(values.PersonalId.value)
        : 0;
      const alias = String(values.UsuarioAlias ?? "")
        .replace(/\s+/g, "")
        .trim();
      const password = values.UsuarioClave ?? "";
      const confirmPassword = values.ConfirmClave ?? "";
      const initialPassword = String(initialData?.UsuarioClave ?? "");

      if (!passwordChangeOnly && personalId <= 0) {
        setError("PersonalId", {
          type: "required",
          message: "Selecciona un personal.",
        });
        setFocus("PersonalId");
        toast.error("Selecciona un personal");
        return false;
      }

      if (!alias) {
        setError("UsuarioAlias", {
          type: "required",
          message: "Usuario/Alias es obligatorio.",
        });
        setFocus("UsuarioAlias");
        toast.error("Ingrese usuario o alias");
        return false;
      }

      const isEditWithoutPasswordChange =
        mode === "edit" &&
        !passwordChangeOnly &&
        password === initialPassword &&
        confirmPassword === initialPassword;

      if (!isEditWithoutPasswordChange) {
        if (!password?.trim()) {
          setError("UsuarioClave", {
            type: "required",
            message: "Contraseña es obligatoria.",
          });
          setFocus("UsuarioClave");
          toast.error("Ingrese la contraseña");
          return false;
        }

        if (!confirmPassword?.trim()) {
          setError("ConfirmClave", {
            type: "required",
            message: "Confirma la contraseña.",
          });
          setFocus("ConfirmClave");
          toast.error("Confirma la contraseña");
          return false;
        }

        if (!passwordMinRules.test(password)) {
          toast.error(
            "La contraseña debe tener minimo 6 caracteres, una mayuscula y un numero",
          );
          return false;
        }

        if (password !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return false;
        }
      }

      const payload = {
        PersonalId: personalId,
        UsuarioAlias: alias,
        UsuarioClave: values.UsuarioClave ?? "",
        UsuarioEstado: values.UsuarioEstado ?? "ACTIVO",
        flag: passwordChangeOnly ? 1 : 0,
        UsuarioSerie: values.UsuarioSerie ?? "B001",
        EnviaBoleta: Number(values.EnviaBoleta ?? 0),
        EnviarFactura: Number(values.EnviarFactura ?? 0),
        EnviaNC: Number(values.EnviaNC ?? 0),
        EnviaND: Number(values.EnviaND ?? 0),
        Administrador: Number(values.Administrador ?? 0),
      };

      const ok = await onSave(payload);
      if (!ok) return false;

      reset(emptyValues);
      onNew?.();
      focusFirstInput(containerRef.current);
      return true;
    },
    [
      clearErrors,
      setError,
      setFocus,
      onSave,
      onNew,
      reset,
      passwordChangeOnly,
      initialData?.UsuarioClave,
      mode,
    ],
  );

  const submitFromOutside = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) return false;
    return onSubmit(getValues());
  }, [trigger, onSubmit, getValues]);

  useEffect(() => {
    if (!onRegisterSubmit) return;
    onRegisterSubmit(submitFromOutside);
    return () => onRegisterSubmit(null);
  }, [onRegisterSubmit, submitFromOutside]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const handleNew = () => {
    reset(emptyValues);
    onNew?.();
    focusFirstInput(containerRef.current);
  };

  const handleRowClick = (row: any) => {
    if (passwordChangeOnly) return;

    const personalOpt =
      employeeOptions.find(
        (opt) => Number(opt.value) === Number(row.PersonalId ?? row.personalId),
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
    <div ref={containerRef} className="h-auto  px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl  overflow-hidden">
        <form
          onSubmit={handleFormSubmit}
          onKeyDown={handleEnterFocus}
          autoComplete="off"
        >
          <input
            type="text"
            name="fake_username"
            autoComplete="username"
            tabIndex={-1}
            className="hidden"
          />
          <input
            type="text"
            name="fake_password"
            autoComplete="off"
            tabIndex={-1}
            className="hidden"
          />
          <div className="p-6 sm:p-8">
            <div
              className={`flex flex-col ${showUsersTable ? "md:flex-row" : ""} gap-6`}
            >
              <div
                className={`w-full ${showUsersTable ? "md:w-[40%]" : ""} space-y-4`}
              >
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
                    disabled={lockIdentityFields}
                    size="small"
                    data-focus-next="input[name='UsuarioAlias']"
                  />
                </div>

                <div className="mt-4">
                  <TextControlled
                    name="UsuarioAlias"
                    control={control}
                    label="Usuario / Alias"
                    autoComplete="off"
                    disableAutoUppercase={true}
                    placeholder="ej: jramirez"
                    required
                    disabled={lockIdentityFields}
                    size="small"
                    inputProps={{
                      name: "usr_alias_new",
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s+/g, "");
                      e.target.value = value;
                    }}
                    disableHistory
                  />
                </div>

                <div className="mt-4">
                  <TextControlled
                    name="UsuarioClave"
                    control={control}
                    label="Contraseña"
                    type="text"
                    autoComplete="off"
                    disableAutoUppercase
                    placeholder="Ingrese contraseña"
                    required
                    size="small"
                    disableHistory
                    inputProps={{
                      name: "usr_pwd_new",
                    }}
                    InputProps={{
                      sx: {
                        "& input": {
                          WebkitTextSecurity: showPass ? "none" : "disc",
                        },
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={
                              showPass
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                            onClick={() => setShowPass((prev) => !prev)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                          >
                            {showPass ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>

                <div className="mt-4">
                  <TextControlled
                    name="ConfirmClave"
                    control={control}
                    label="Confirmar contraseña"
                    type="text"
                    autoComplete="off"
                    disableAutoUppercase
                    placeholder="Repita la contraseña"
                    required
                    size="small"
                    disableHistory
                    inputProps={{
                      name: "usr_pwd_new_confirm",
                    }}
                    InputProps={{
                      sx: {
                        "& input": {
                          WebkitTextSecurity: showPassConfirm ? "none" : "disc",
                        },
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={
                              showPassConfirm
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                            onClick={() => setShowPassConfirm((prev) => !prev)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                          >
                            {showPassConfirm ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>

                {!passwordChangeOnly && (
                  <div className="mt-4">
                    <SelectControlled
                      name="UsuarioEstado"
                      control={control}
                      label="Estado"
                      options={estadoOptions}
                      disabled={mode === "create" || lockIdentityFields}
                      size="small"
                      autoAdvance
                    />
                  </div>
                )}
              </div>

              {showUsersTable && (
                <div className="w-full md:w-[60%] mt-6 md:mt-0 h-[500px]">
                  <DataTable
                    columns={columns}
                    data={users}
                    filterKeys={["UsuarioAlias", "UsuarioEstado", "area"]}
                    onRowClick={handleRowClick}
                    renderFilters={
                      <select
                        value={usersEstado}
                        onChange={(e) =>
                          setUsersEstado(
                            e.target.value as "ACTIVO" | "INACTIVO",
                          )
                        }
                        className="border border-gray-300 rounded px-2 py-1  text-sm"
                      >
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                      </select>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
