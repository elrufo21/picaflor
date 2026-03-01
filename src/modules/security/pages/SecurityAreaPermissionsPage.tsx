import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MaintenancePageFrame from "@/modules/maintenance/components/MaintenancePageFrame";
import { API_BASE_URL } from "@/config";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useAreasQuery } from "@/modules/maintenance/areas/useAreasQuery";
import type { ModuleCode } from "@/app/auth/mockModulePermissions";
import {
  readAreaModulePermissionOverride,
  readAreaModuleActionModes,
  saveAreaModuleActionModes,
  saveAreaModulePermissionOverride,
} from "@/app/auth/areaPermissionOverrides";
import type {
  PermissionMode,
  UserModuleActionModes,
} from "@/app/auth/moduleActionPermissions";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import { SUBMODULE_OPTIONS } from "@/app/auth/submoduleCatalog";
import {
  readAreaSubmodulePermissionOverride,
  readAreaSubmoduleActionModes,
  saveAreaSubmoduleActionModes,
  saveAreaSubmodulePermissionOverride,
  type SubmoduleActionModes,
} from "@/app/auth/areaSubmodulePermissionOverrides";
import { useSubmodulePermissionsStore } from "@/store/permissions/submodulePermissions.store";

const MODULE_OPTIONS: Array<{ code: ModuleCode; label: string }> = [
  { code: "fullday", label: "fullday" },
  { code: "programacion", label: "programacion" },
  { code: "citytour", label: "citytour" },
  { code: "paquete_viaje", label: "paquete de viaje" },
  { code: "cashflow", label: "cashflow" },
  { code: "maintenance", label: "mantenimiento" },
  { code: "security", label: "seguridad" },
];

type ModuleCheckRow = {
  module: boolean;
  read: boolean;
  edit: boolean;
  create: boolean;
  delete: boolean;
};

type ModuleChecks = Record<ModuleCode, ModuleCheckRow>;
type SubmoduleCheckRow = {
  submodule: boolean;
  read: boolean;
  edit: boolean;
  create: boolean;
  delete: boolean;
};
type SubmoduleChecks = Record<string, SubmoduleCheckRow>;
type PermissionAction = "read" | "edit" | "create" | "delete";

const AREA_PERMISSIONS_ENDPOINT = `${API_BASE_URL}/Seguridad/permisos-area`;
const AREA_PERMISSIONS_SAVE_ENDPOINT = `${API_BASE_URL}/Seguridad/permisos-area/guardar`;
const MODULE_CODE_SET = new Set<ModuleCode>(MODULE_OPTIONS.map((item) => item.code));
const SUBMODULE_CODE_SET = new Set<string>(
  SUBMODULE_OPTIONS.map((item) => String(item.code).trim().toLowerCase()),
);
const ACTION_KEYS: PermissionAction[] = ["read", "edit", "create", "delete"];

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
    acc[submodule.code] = {
      submodule: false,
      read: false,
      edit: false,
      create: false,
      delete: false,
    };
    return acc;
  }, {} as SubmoduleChecks);

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
  actionModes: SubmoduleActionModes,
): SubmoduleChecks =>
  SUBMODULE_OPTIONS.reduce((acc, item) => {
    acc[item.code] = {
      submodule: modes[item.code] === "allow",
      read: actionModes[item.code]?.read === "allow",
      edit: actionModes[item.code]?.edit === "allow",
      create: actionModes[item.code]?.create === "allow",
      delete: actionModes[item.code]?.delete === "allow",
    };
    return acc;
  }, {} as SubmoduleChecks);

const submoduleChecksToModes = (
  checks: SubmoduleChecks,
): Record<string, PermissionMode> =>
  SUBMODULE_OPTIONS.reduce((acc, item) => {
    acc[item.code] = checks[item.code]?.submodule ? "allow" : "deny";
    return acc;
  }, {} as Record<string, PermissionMode>);

const emptySubmoduleActionModes = (): SubmoduleActionModes =>
  SUBMODULE_OPTIONS.reduce(
    (acc, item) => {
      acc[item.code] = {
        read: "inherit",
        edit: "inherit",
        create: "inherit",
        delete: "inherit",
      };
      return acc;
    },
    {} as SubmoduleActionModes,
  );

const submoduleChecksToActionModes = (
  checks: SubmoduleChecks,
): SubmoduleActionModes =>
  SUBMODULE_OPTIONS.reduce(
    (acc, item) => {
      const row = checks[item.code];
      acc[item.code] = {
        read: row?.read ? "allow" : "deny",
        edit: row?.edit ? "allow" : "deny",
        create: row?.create ? "allow" : "deny",
        delete: row?.delete ? "allow" : "deny",
      };
      return acc;
    },
    {} as SubmoduleActionModes,
  );

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

const toMode = (value: boolean): "allow" | "deny" => (value ? "allow" : "deny");

const buildAreaSavePayload = (
  areaId: string,
  moduleChecks: ModuleChecks,
  subChecks: SubmoduleChecks,
) => {
  const moduleRows = MODULE_OPTIONS.map(({ code }) => {
    const row = moduleChecks[code];
    return [
      "M",
      code,
      toMode(Boolean(row?.module)),
      toMode(Boolean(row?.read)),
      toMode(Boolean(row?.edit)),
      toMode(Boolean(row?.create)),
      toMode(Boolean(row?.delete)),
    ].join("|");
  });

  const submoduleRows = SUBMODULE_OPTIONS.map(({ code }) => {
    const row = subChecks[code];
    return [
      "S",
      code,
      toMode(Boolean(row?.submodule)),
      toMode(Boolean(row?.read)),
      toMode(Boolean(row?.edit)),
      toMode(Boolean(row?.create)),
      toMode(Boolean(row?.delete)),
    ].join("|");
  });

  return [String(areaId), ...moduleRows, ...submoduleRows].join("¬");
};

const parseCsv = (value: string): string[] =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const emptyActionModes = (): UserModuleActionModes =>
  MODULE_OPTIONS.reduce(
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

const isPermissionMode = (value: string): value is PermissionMode =>
  value === "allow" || value === "deny" || value === "inherit";

const parseActionModesFlat = (value: string): UserModuleActionModes => {
  const modes = emptyActionModes();
  const rows = String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  rows.forEach((row) => {
    const separator = row.indexOf(":");
    if (separator <= 0) return;

    const rawModuleCode = row.slice(0, separator).trim().toLowerCase();
    if (!MODULE_CODE_SET.has(rawModuleCode as ModuleCode)) return;
    const moduleCode = rawModuleCode as ModuleCode;

    const values = row
      .slice(separator + 1)
      .split(",")
      .map((item) => item.trim().toLowerCase());

    ACTION_KEYS.forEach((action, index) => {
      const raw = values[index] ?? "inherit";
      modes[moduleCode][action] = isPermissionMode(raw) ? raw : "inherit";
    });
  });

  return modes;
};

const parseAreaPermissionsPayload = (rawPayload: string) => {
  const payload = String(rawPayload ?? "").replace(/Â¬/g, "¬").trim();
  if (!payload || payload === "~") return null;

  // Formato nuevo: filas separadas por "¬" con prefijo M| o S|
  if (payload.includes("¬") && (payload.includes("M|") || payload.includes("S|"))) {
    const moduleAllow = new Set<ModuleCode>();
    const moduleDeny = new Set<ModuleCode>();
    const submoduleAllow = new Set<string>();
    const submoduleDeny = new Set<string>();
    const actionModes = emptyActionModes();
    const submoduleActionModes = emptySubmoduleActionModes();

    const rows = payload
      .split("¬")
      .map((row) => row.trim())
      .filter(Boolean);

    rows.forEach((row) => {
      const parts = row.split("|");
      const recordType = String(parts[0] ?? "").trim().toUpperCase();

      if (recordType === "M") {
        if (parts.length < 9) return;
        const rawModuleCode = String(parts[3] ?? "").trim().toLowerCase();
        if (!MODULE_CODE_SET.has(rawModuleCode as ModuleCode)) return;
        const moduleCode = rawModuleCode as ModuleCode;

        const moduleMode = String(parts[4] ?? "inherit").trim().toLowerCase();
        if (moduleMode === "allow") moduleAllow.add(moduleCode);
        if (moduleMode === "deny") moduleDeny.add(moduleCode);

        ACTION_KEYS.forEach((action, index) => {
          const rawActionMode = String(parts[5 + index] ?? "inherit")
            .trim()
            .toLowerCase();
          actionModes[moduleCode][action] = isPermissionMode(rawActionMode)
            ? rawActionMode
            : "inherit";
        });
        return;
      }

      if (recordType === "S") {
        if (parts.length < 5) return;
        const submoduleCode = String(parts[3] ?? "").trim().toLowerCase();
        if (!SUBMODULE_CODE_SET.has(submoduleCode)) return;

        const mode = String(parts[4] ?? "inherit").trim().toLowerCase();
        if (mode === "allow") submoduleAllow.add(submoduleCode);
        if (mode === "deny") submoduleDeny.add(submoduleCode);

        ACTION_KEYS.forEach((action, index) => {
          const rawActionMode = String(parts[5 + index] ?? "inherit")
            .trim()
            .toLowerCase();
          submoduleActionModes[submoduleCode][action] = isPermissionMode(
            rawActionMode,
          )
            ? rawActionMode
            : "inherit";
        });
      }
    });

    return {
      moduleOverride: {
        allow: Array.from(moduleAllow),
        deny: Array.from(moduleDeny),
      },
      actionModes,
      submoduleOverride: {
        allow: Array.from(submoduleAllow),
        deny: Array.from(submoduleDeny),
      },
      submoduleActionModes,
    };
  }

  // Formato anterior resumido: AreaId|AreaNombre|ModulesAllow|ModulesDeny|ActionModes|SubAllow|SubDeny|Version
  const parts = payload.split("|");
  if (parts.length < 8) return null;

  const modulesAllow = parseCsv(parts[2]).filter((code) =>
    MODULE_CODE_SET.has(code.toLowerCase() as ModuleCode),
  ) as ModuleCode[];
  const modulesDeny = parseCsv(parts[3]).filter((code) =>
    MODULE_CODE_SET.has(code.toLowerCase() as ModuleCode),
  ) as ModuleCode[];

  const submodulesAllow = parseCsv(parts[5])
    .map((code) => code.toLowerCase())
    .filter((code) => SUBMODULE_CODE_SET.has(code));
  const submodulesDeny = parseCsv(parts[6])
    .map((code) => code.toLowerCase())
    .filter((code) => SUBMODULE_CODE_SET.has(code));

  return {
    moduleOverride: { allow: modulesAllow, deny: modulesDeny },
    actionModes: parseActionModesFlat(parts[4]),
    submoduleOverride: { allow: submodulesAllow, deny: submodulesDeny },
    submoduleActionModes: emptySubmoduleActionModes(),
  };
};

const getRawPermissionsPayload = (responseText: string): string | null => {
  const trimmed = String(responseText ?? "").trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const objectPayload = parsed as Record<string, unknown>;
      const candidate =
        objectPayload.data ??
        objectPayload.Data ??
        objectPayload.resultado ??
        objectPayload.Resultado ??
        objectPayload.result ??
        objectPayload.Result;
      if (typeof candidate === "string") return candidate;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

const SecurityAreaPermissionsPage = () => {
  useAreasQuery();
  const areas = useMaintenanceStore((state) => state.areas);
  const authUser = useAuthStore((state) => state.user);
  const loadForUser = useModulePermissionsStore((state) => state.loadForUser);
  const loadSubmodulesForUser = useSubmodulePermissionsStore(
    (state) => state.loadForUser,
  );
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [checks, setChecks] = useState<ModuleChecks>(emptyChecks());
  const [submoduleChecks, setSubmoduleChecks] =
    useState<SubmoduleChecks>(emptySubmoduleChecks());

  useEffect(() => {
    if (!selectedAreaId && areas.length) {
      setSelectedAreaId(String(areas[0]?.id ?? ""));
    }
  }, [selectedAreaId, areas]);

  const selectedArea = useMemo(
    () => areas.find((area) => String(area.id) === String(selectedAreaId)),
    [areas, selectedAreaId],
  );

  useEffect(() => {
    if (!selectedAreaId) {
      setChecks(emptyChecks());
      setSubmoduleChecks(emptySubmoduleChecks());
      return;
    }
    const controller = new AbortController();

    const loadAreaPermissions = async () => {
      try {
        const response = await fetch(AREA_PERMISSIONS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "text/plain, application/json",
          },
          body: JSON.stringify({ data: String(selectedAreaId) }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const responseText = await response.text();
        const rawPayload = getRawPermissionsPayload(responseText);
        const parsed = parseAreaPermissionsPayload(rawPayload ?? "");
        if (!parsed) throw new Error("Payload de permisos de area invalido.");

        saveAreaModulePermissionOverride(selectedAreaId, parsed.moduleOverride);
        saveAreaModuleActionModes(selectedAreaId, parsed.actionModes);
        saveAreaSubmodulePermissionOverride(selectedAreaId, parsed.submoduleOverride);
        saveAreaSubmoduleActionModes(
          selectedAreaId,
          parsed.submoduleActionModes ?? emptySubmoduleActionModes(),
        );

        const moduleModes = toPermissionModes(parsed.moduleOverride);
        const submoduleModes = toSubmoduleModes(parsed.submoduleOverride);
        const submoduleActions =
          parsed.submoduleActionModes ?? emptySubmoduleActionModes();
        setChecks(toChecks(moduleModes, parsed.actionModes));
        setSubmoduleChecks(submoduleModesToChecks(submoduleModes, submoduleActions));
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return;

        console.error("No se pudo cargar permisos por area desde backend", error);
        const moduleOverride = readAreaModulePermissionOverride(selectedAreaId);
        const moduleModes = toPermissionModes(moduleOverride);
        const actionModes = readAreaModuleActionModes(selectedAreaId);
        const submoduleOverride = readAreaSubmodulePermissionOverride(selectedAreaId);
        const submoduleModes = toSubmoduleModes(submoduleOverride);
        const submoduleActionModes = readAreaSubmoduleActionModes(selectedAreaId);
        setChecks(toChecks(moduleModes, actionModes));
        setSubmoduleChecks(
          submoduleModesToChecks(submoduleModes, submoduleActionModes),
        );
      }
    };

    void loadAreaPermissions();

    return () => controller.abort();
  }, [selectedAreaId]);

  const toggleCheck = (
    moduleCode: ModuleCode,
    key: keyof ModuleCheckRow,
    value: boolean,
  ) => {
    setChecks((prev) => ({
      ...prev,
      [moduleCode]: (() => {
        const row = prev[moduleCode];
        if (key === "module") {
          return {
            module: value,
            read: value,
            edit: value,
            create: value,
            delete: value,
          };
        }

        const nextRow: ModuleCheckRow = {
          ...row,
          [key]: value,
        };

        if (key !== "module" && value) {
          nextRow.module = true;
        }

        if (key !== "module" && value) {
          nextRow.read = true;
        }

        if (nextRow.module) {
          nextRow.read = true;
        }

        return nextRow;
      })(),
    }));
  };

  const toggleSubmoduleCheck = (
    submoduleCode: string,
    key: keyof SubmoduleCheckRow,
    value: boolean,
  ) => {
    setSubmoduleChecks((prev) => ({
      ...prev,
      [submoduleCode]: (() => {
        const row = prev[submoduleCode];
        if (key === "submodule") {
          return {
            submodule: value,
            read: value,
            edit: value,
            create: value,
            delete: value,
          };
        }

        const nextRow: SubmoduleCheckRow = {
          ...row,
          [key]: value,
        };

        if (key !== "submodule" && value) {
          nextRow.submodule = true;
        }

        if (key !== "submodule" && value) {
          nextRow.read = true;
        }

        if (nextRow.submodule) {
          nextRow.read = true;
        }

        return nextRow;
      })(),
    }));
  };

  const handleSave = async () => {
    if (!selectedAreaId) {
      toast.error("Selecciona un área.");
      return;
    }

    const payloadPlano = buildAreaSavePayload(
      String(selectedAreaId),
      checks,
      submoduleChecks,
    );
    console.log("PermisosArea payload plano:", payloadPlano);

    try {
      const response = await fetch(AREA_PERMISSIONS_SAVE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "text/plain, application/json",
        },
        body: JSON.stringify({ data: payloadPlano }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawText = (await response.text()).trim();
      const resultText = getRawPermissionsPayload(rawText) ?? rawText;
      const normalizedResult = String(resultText ?? "").trim();
      if (normalizedResult && normalizedResult.startsWith("~")) {
        throw new Error(normalizedResult);
      }
    } catch (error) {
      console.error("No se pudo guardar permisos por area en backend", error);
      toast.error("No se pudo guardar en la base de datos.");
      return;
    }

    const moduleModes = checksToModuleModes(checks);
    const actionModes = checksToActionModes(checks);
    const subModes = submoduleChecksToModes(submoduleChecks);
    const subActionModes = submoduleChecksToActionModes(submoduleChecks);
    saveAreaModulePermissionOverride(selectedAreaId, toOverride(moduleModes));
    saveAreaModuleActionModes(selectedAreaId, actionModes);
    saveAreaSubmodulePermissionOverride(selectedAreaId, toSubmoduleOverride(subModes));
    saveAreaSubmoduleActionModes(selectedAreaId, subActionModes);

    if (String(authUser?.areaId ?? "") === String(selectedAreaId)) {
      loadForUser(authUser);
      loadSubmodulesForUser(authUser);
    }
    toast.success("Permisos por área guardados.");
  };

  const handleUseDefaultBase = () => {
    if (!selectedAreaId) return;
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

    saveAreaModulePermissionOverride(
      selectedAreaId,
      toOverride(inheritModuleModes),
    );
    saveAreaModuleActionModes(selectedAreaId, inheritActionModes);
    saveAreaSubmodulePermissionOverride(selectedAreaId, { allow: [], deny: [] });
    saveAreaSubmoduleActionModes(selectedAreaId, emptySubmoduleActionModes());
    setChecks(emptyChecks());
    setSubmoduleChecks(emptySubmoduleChecks());

    if (String(authUser?.areaId ?? "") === String(selectedAreaId)) {
      loadForUser(authUser);
      loadSubmodulesForUser(authUser);
    }
    toast.success("Área restaurada a configuración base.");
  };

  return (
    <MaintenancePageFrame
      title="Permisos por área"
      description="Define la base heredada para usuarios de un área."
      backTo="/seguridad"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Área</span>
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            {areas.map((area) => (
              <option key={area.id} value={String(area.id)}>
                {area.area}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm text-slate-700">
          Área seleccionada: <strong>{selectedArea?.area ?? "Ninguna"}</strong>
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
                      checked={submoduleChecks[submodule.code]?.submodule ?? false}
                      onChange={(e) =>
                        toggleSubmoduleCheck(
                          submodule.code,
                          "submodule",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={submoduleChecks[submodule.code]?.read ?? false}
                      onChange={(e) =>
                        toggleSubmoduleCheck(submodule.code, "read", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={submoduleChecks[submodule.code]?.edit ?? false}
                      onChange={(e) =>
                        toggleSubmoduleCheck(submodule.code, "edit", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={submoduleChecks[submodule.code]?.create ?? false}
                      onChange={(e) =>
                        toggleSubmoduleCheck(
                          submodule.code,
                          "create",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#E8612A] focus:ring-[#E8612A]/30"
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={submoduleChecks[submodule.code]?.delete ?? false}
                      onChange={(e) =>
                        toggleSubmoduleCheck(
                          submodule.code,
                          "delete",
                          e.target.checked,
                        )
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
            onClick={handleUseDefaultBase}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Usar base
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedAreaId}
            className="rounded-lg bg-[#E8612A] px-4 py-2 text-sm font-medium text-white hover:bg-[#d55320] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar permisos
          </button>
        </div>
      </div>
    </MaintenancePageFrame>
  );
};

export default SecurityAreaPermissionsPage;
