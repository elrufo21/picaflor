import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MaintenancePageFrame from "@/modules/maintenance/components/MaintenancePageFrame";
import { useUsersStore } from "@/store/users/users.store";
import type { ModuleCode } from "@/app/auth/mockModulePermissions";
import {
  readUserModulePermissionOverride,
  saveUserModulePermissionOverride,
} from "@/app/auth/modulePermissionOverrides";
import {
  readUserModuleActionModes,
  saveUserModuleActionModes,
  type PermissionMode,
  type UserModuleActionModes,
} from "@/app/auth/moduleActionPermissions";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import { SUBMODULE_OPTIONS } from "@/app/auth/submoduleCatalog";
import {
  readUserSubmodulePermissionOverride,
  saveUserSubmodulePermissionOverride,
} from "@/app/auth/submodulePermissionOverrides";
import { useSubmodulePermissionsStore } from "@/store/permissions/submodulePermissions.store";

const MODULE_OPTIONS: Array<{ code: ModuleCode; label: string }> = [
  { code: "fullday", label: "fullday" },
  { code: "programacion", label: "programacion" },
  { code: "citytour", label: "citytour" },
  { code: "paquete_viaje", label: "paquete de viaje" },
  { code: "cashflow", label: "cashflow" },
  { code: "maintenance", label: "Mantenimiento" },
  { code: "security", label: "Seguridad" },
];

type ModuleCheckRow = {
  module: boolean;
  read: boolean;
  edit: boolean;
  create: boolean;
  delete: boolean;
};

type ModuleChecks = Record<ModuleCode, ModuleCheckRow>;
type SubmoduleChecks = Record<string, boolean>;

const toPermissionModes = (override: {
  allow?: ModuleCode[];
  deny?: ModuleCode[];
}): Record<ModuleCode, PermissionMode> => {
  const allowSet = new Set(override.allow ?? []);
  const denySet = new Set(override.deny ?? []);

  return MODULE_OPTIONS.reduce(
    (acc, item) => {
      if (denySet.has(item.code)) {
        acc[item.code] = "deny";
        return acc;
      }
      if (allowSet.has(item.code)) {
        acc[item.code] = "allow";
        return acc;
      }
      acc[item.code] = "inherit";
      return acc;
    },
    {} as Record<ModuleCode, PermissionMode>,
  );
};

const toOverride = (modes: Record<ModuleCode, PermissionMode>) => {
  const allow: ModuleCode[] = [];
  const deny: ModuleCode[] = [];

  MODULE_OPTIONS.forEach(({ code }) => {
    const mode = modes[code];
    if (mode === "allow") allow.push(code);
    if (mode === "deny") deny.push(code);
  });

  return { allow, deny };
};

const emptyChecks = (): ModuleChecks =>
  MODULE_OPTIONS.reduce(
    (acc, module) => {
      acc[module.code] = {
        module: false,
        read: false,
        edit: false,
        create: false,
        delete: false,
      };
      return acc;
    },
    {} as ModuleChecks,
  );

const emptySubmoduleChecks = (): SubmoduleChecks =>
  SUBMODULE_OPTIONS.reduce((acc, submodule) => {
    acc[submodule.code] = false;
    return acc;
  }, {} as SubmoduleChecks);

const toChecks = (
  moduleModes: Record<ModuleCode, PermissionMode>,
  actionModes: UserModuleActionModes,
): ModuleChecks =>
  MODULE_OPTIONS.reduce(
    (acc, module) => {
      acc[module.code] = {
        module: moduleModes[module.code] === "allow",
        read: actionModes[module.code]?.read === "allow",
        edit: actionModes[module.code]?.edit === "allow",
        create: actionModes[module.code]?.create === "allow",
        delete: actionModes[module.code]?.delete === "allow",
      };
      return acc;
    },
    {} as ModuleChecks,
  );

const checksToModuleModes = (
  checks: ModuleChecks,
): Record<ModuleCode, PermissionMode> =>
  MODULE_OPTIONS.reduce(
    (acc, module) => {
      acc[module.code] = checks[module.code].module ? "allow" : "deny";
      return acc;
    },
    {} as Record<ModuleCode, PermissionMode>,
  );

const checksToActionModes = (checks: ModuleChecks): UserModuleActionModes =>
  MODULE_OPTIONS.reduce(
    (acc, module) => {
      acc[module.code] = {
        read: checks[module.code].read ? "allow" : "deny",
        edit: checks[module.code].edit ? "allow" : "deny",
        create: checks[module.code].create ? "allow" : "deny",
        delete: checks[module.code].delete ? "allow" : "deny",
      };
      return acc;
    },
    {} as UserModuleActionModes,
  );

const toSubmoduleModes = (override: { allow?: string[]; deny?: string[] }) => {
  const allowSet = new Set((override.allow ?? []).map(String));
  const denySet = new Set((override.deny ?? []).map(String));

  return SUBMODULE_OPTIONS.reduce<Record<string, PermissionMode>>(
    (acc, item) => {
      if (denySet.has(item.code)) {
        acc[item.code] = "deny";
        return acc;
      }
      if (allowSet.has(item.code)) {
        acc[item.code] = "allow";
        return acc;
      }
      acc[item.code] = "inherit";
      return acc;
    },
    {},
  );
};

const submoduleModesToChecks = (
  modes: Record<string, PermissionMode>,
): SubmoduleChecks =>
  SUBMODULE_OPTIONS.reduce((acc, item) => {
    acc[item.code] = modes[item.code] === "allow";
    return acc;
  }, {} as SubmoduleChecks);

const submoduleChecksToModes = (
  checks: SubmoduleChecks,
): Record<string, PermissionMode> =>
  SUBMODULE_OPTIONS.reduce((acc, item) => {
    acc[item.code] = checks[item.code] ? "allow" : "deny";
    return acc;
  }, {} as Record<string, PermissionMode>);

const toSubmoduleOverride = (modes: Record<string, PermissionMode>) => {
  const allow: string[] = [];
  const deny: string[] = [];

  SUBMODULE_OPTIONS.forEach(({ code }) => {
    const mode = modes[code];
    if (mode === "allow") allow.push(code);
    if (mode === "deny") deny.push(code);
  });

  return { allow, deny };
};

const SecurityPermissionsPage = () => {
  const { users, fetchUsers, loading } = useUsersStore();
  const authUser = useAuthStore((state) => state.user);
  const loadForUser = useModulePermissionsStore((state) => state.loadForUser);
  const loadSubmodulesForUser = useSubmodulePermissionsStore(
    (state) => state.loadForUser,
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [checks, setChecks] = useState<ModuleChecks>(emptyChecks());
  const [submoduleChecks, setSubmoduleChecks] =
    useState<SubmoduleChecks>(emptySubmoduleChecks());

  useEffect(() => {
    fetchUsers("ACTIVO");
  }, [fetchUsers]);

  useEffect(() => {
    if (!selectedUserId && users.length) {
      setSelectedUserId(String(users[0]?.UsuarioID ?? ""));
    }
  }, [selectedUserId, users]);

  const selectedUser = useMemo(
    () => users.find((u) => String(u.UsuarioID) === String(selectedUserId)),
    [users, selectedUserId],
  );

  useEffect(() => {
    if (!selectedUserId) {
      setChecks(emptyChecks());
      setSubmoduleChecks(emptySubmoduleChecks());
      return;
    }
    const override = readUserModulePermissionOverride(String(selectedUserId));
    const moduleModes = toPermissionModes(override);
    const actionModes = readUserModuleActionModes(String(selectedUserId));
    const submoduleOverride = readUserSubmodulePermissionOverride(
      String(selectedUserId),
    );
    const submoduleModes = toSubmoduleModes(submoduleOverride);
    setChecks(toChecks(moduleModes, actionModes));
    setSubmoduleChecks(submoduleModesToChecks(submoduleModes));
  }, [selectedUserId]);

  const handleSave = () => {
    if (!selectedUserId) {
      toast.error("Selecciona un usuario.");
      return;
    }

    const moduleModes = checksToModuleModes(checks);
    const actionModes = checksToActionModes(checks);
    const subModes = submoduleChecksToModes(submoduleChecks);
    saveUserModulePermissionOverride(selectedUserId, toOverride(moduleModes));
    saveUserModuleActionModes(selectedUserId, actionModes);
    saveUserSubmodulePermissionOverride(selectedUserId, toSubmoduleOverride(subModes));
    if (String(authUser?.id ?? "") === String(selectedUserId)) {
      loadForUser(authUser);
      loadSubmodulesForUser(authUser);
    }
    toast.success("Permisos guardados.");
  };

  const handleClearOverrides = () => {
    if (!selectedUserId) return;

    const inheritModuleModes = MODULE_OPTIONS.reduce(
      (acc, module) => {
        acc[module.code] = "inherit";
        return acc;
      },
      {} as Record<ModuleCode, PermissionMode>,
    );

    const inheritActionModes = MODULE_OPTIONS.reduce(
      (acc, module) => {
        acc[module.code] = {
          read: "inherit",
          edit: "inherit",
          create: "inherit",
          delete: "inherit",
        };
        return acc;
      },
      {} as UserModuleActionModes,
    );

    saveUserModulePermissionOverride(selectedUserId, toOverride(inheritModuleModes));
    saveUserModuleActionModes(selectedUserId, inheritActionModes);
    saveUserSubmodulePermissionOverride(selectedUserId, { allow: [], deny: [] });
    setChecks(emptyChecks());
    setSubmoduleChecks(emptySubmoduleChecks());

    if (String(authUser?.id ?? "") === String(selectedUserId)) {
      loadForUser(authUser);
      loadSubmodulesForUser(authUser);
    }
    toast.success("Overrides limpiados. El usuario vuelve a heredar por área.");
  };

  const toggleCheck = (
    moduleCode: ModuleCode,
    key: keyof ModuleCheckRow,
    value: boolean,
  ) => {
    setChecks((prev) => ({
      ...prev,
      [moduleCode]: {
        ...prev[moduleCode],
        [key]: value,
      },
    }));
  };

  const toggleSubmoduleCheck = (submoduleCode: string, value: boolean) => {
    setSubmoduleChecks((prev) => ({
      ...prev,
      [submoduleCode]: value,
    }));
  };

  return (
    <MaintenancePageFrame
      title="Permisos de módulos"
      description="Otorga permisos por módulo para usuarios específicos."
      backTo="/seguridad"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Usuario</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              {users.map((user) => (
                <option key={user.UsuarioID} value={String(user.UsuarioID)}>
                  {user.UsuarioAlias} - {user.area || "Sin área"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm text-slate-700">
          Usuario seleccionado:{" "}
          <strong>{selectedUser?.UsuarioAlias ?? "Ninguno"}</strong>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[620px] border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700">
                  modulo
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  permitido
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  lectura
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  edicion
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  creacion
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  eliminacion
                </th>
              </tr>
            </thead>
            <tbody>
              {MODULE_OPTIONS.map((module) => (
                <tr key={module.code} className="bg-white">
                  <td className="border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    {module.label}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checks[module.code]?.module ?? false}
                      onChange={(e) =>
                        toggleCheck(module.code, "module", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checks[module.code]?.read ?? false}
                      onChange={(e) =>
                        toggleCheck(module.code, "read", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checks[module.code]?.edit ?? false}
                      onChange={(e) =>
                        toggleCheck(module.code, "edit", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checks[module.code]?.create ?? false}
                      onChange={(e) =>
                        toggleCheck(module.code, "create", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checks[module.code]?.delete ?? false}
                      onChange={(e) =>
                        toggleCheck(module.code, "delete", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[620px] border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700">
                  submodulo / boton
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  permitido
                </th>
              </tr>
            </thead>
            <tbody>
              {SUBMODULE_OPTIONS.map((submodule) => (
                <tr key={submodule.code} className="bg-white">
                  <td className="border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <div className="font-medium">{submodule.label}</div>
                    <div className="text-xs text-slate-500">
                      {submodule.detail ?? "Permiso de acceso."}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Codigo: {submodule.code}
                    </div>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={submoduleChecks[submodule.code] ?? false}
                      onChange={(e) =>
                        toggleSubmoduleCheck(submodule.code, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClearOverrides}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Usar heredado
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !selectedUserId}
            className="rounded-lg bg-[#E8612A] px-4 py-2 text-sm font-medium text-white hover:bg-[#d55320] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar permisos
          </button>
        </div>
      </div>
    </MaintenancePageFrame>
  );
};

export default SecurityPermissionsPage;
