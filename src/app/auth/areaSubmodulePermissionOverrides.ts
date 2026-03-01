import { SUBMODULE_OPTIONS } from "./submoduleCatalog";
import type { PermissionMode } from "./moduleActionPermissions";

export type AreaSubmodulePermissionOverride = {
  allow?: string[];
  deny?: string[];
};

export type SubmoduleActionModes = Record<
  string,
  {
    read: PermissionMode;
    edit: PermissionMode;
    create: PermissionMode;
    delete: PermissionMode;
  }
>;

const STORAGE_KEY = "picaflor.permissions.area-submodule-overrides";
const ACTIONS_STORAGE_KEY = "picaflor.permissions.area-submodule-actions";

const VALID_SUBMODULE_CODES = new Set(
  SUBMODULE_OPTIONS.map((item) => String(item.code).trim().toLowerCase()),
);

const normalizeCode = (value: string) => String(value ?? "").trim().toLowerCase();

const isSubmoduleCode = (value: string) =>
  VALID_SUBMODULE_CODES.has(normalizeCode(value));

const sanitizeOverride = (
  value: AreaSubmodulePermissionOverride,
): AreaSubmodulePermissionOverride => {
  const allow = Array.from(
    new Set((value.allow ?? []).map(normalizeCode).filter(isSubmoduleCode)),
  );
  const deny = Array.from(
    new Set((value.deny ?? []).map(normalizeCode).filter(isSubmoduleCode)),
  );

  return { allow, deny };
};

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

const isPermissionMode = (value: string): value is PermissionMode =>
  value === "allow" || value === "deny" || value === "inherit";

const sanitizeActionModes = (value: unknown): SubmoduleActionModes => {
  const base = emptySubmoduleActionModes();
  if (!value || typeof value !== "object") return base;

  SUBMODULE_OPTIONS.forEach((item) => {
    const entry = (value as Record<string, unknown>)[item.code];
    if (!entry || typeof entry !== "object") return;

    (["read", "edit", "create", "delete"] as const).forEach((action) => {
      const raw = (entry as Record<string, unknown>)[action];
      const normalized = String(raw ?? "inherit").trim().toLowerCase();
      base[item.code][action] = isPermissionMode(normalized)
        ? normalized
        : "inherit";
    });
  });

  return base;
};

const readAllAreaSubmoduleOverrides = (): Record<
  string,
  AreaSubmodulePermissionOverride
> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<
      string,
      AreaSubmodulePermissionOverride
    >;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<
      Record<string, AreaSubmodulePermissionOverride>
    >((acc, [areaId, override]) => {
      if (!areaId) return acc;
      acc[String(areaId)] = sanitizeOverride(override ?? {});
      return acc;
    }, {});
  } catch {
    return {};
  }
};

export const readAreaSubmodulePermissionOverride = (
  areaId: string,
): AreaSubmodulePermissionOverride => {
  const all = readAllAreaSubmoduleOverrides();
  return all[String(areaId)] ?? {};
};

export const saveAreaSubmodulePermissionOverride = (
  areaId: string,
  override: AreaSubmodulePermissionOverride,
) => {
  if (typeof window === "undefined") return;
  const normalizedAreaId = String(areaId ?? "").trim();
  if (!normalizedAreaId) return;

  const all = readAllAreaSubmoduleOverrides();
  all[normalizedAreaId] = sanitizeOverride(override);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

const readAllAreaSubmoduleActionModes = (): Record<string, SubmoduleActionModes> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(ACTIONS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, SubmoduleActionModes>>(
      (acc, [areaId, modes]) => {
        if (!areaId) return acc;
        acc[String(areaId)] = sanitizeActionModes(modes);
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

export const readAreaSubmoduleActionModes = (areaId: string): SubmoduleActionModes => {
  const all = readAllAreaSubmoduleActionModes();
  return all[String(areaId)] ?? emptySubmoduleActionModes();
};

export const saveAreaSubmoduleActionModes = (
  areaId: string,
  modes: SubmoduleActionModes,
) => {
  if (typeof window === "undefined") return;
  const normalizedAreaId = String(areaId ?? "").trim();
  if (!normalizedAreaId) return;

  const all = readAllAreaSubmoduleActionModes();
  all[normalizedAreaId] = sanitizeActionModes(modes);
  window.localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(all));
};
