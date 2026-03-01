import { SUBMODULE_OPTIONS } from "./submoduleCatalog";
import type { PermissionMode } from "./moduleActionPermissions";

export type SubmodulePermissionOverride = {
  allow?: string[];
  deny?: string[];
};

export type UserSubmoduleActionModes = Record<
  string,
  {
    read: PermissionMode;
    edit: PermissionMode;
    create: PermissionMode;
    delete: PermissionMode;
  }
>;

const STORAGE_KEY = "picaflor.permissions.submodule-overrides";
const ACTIONS_STORAGE_KEY = "picaflor.permissions.submodule-actions";

const VALID_SUBMODULE_CODES = new Set(
  SUBMODULE_OPTIONS.map((item) => String(item.code).trim().toLowerCase()),
);

const normalizeCode = (value: string) => String(value ?? "").trim().toLowerCase();

const isSubmoduleCode = (value: string) =>
  VALID_SUBMODULE_CODES.has(normalizeCode(value));

const sanitizeOverride = (
  value: SubmodulePermissionOverride,
): SubmodulePermissionOverride => {
  const allow = Array.from(
    new Set((value.allow ?? []).map(normalizeCode).filter(isSubmoduleCode)),
  );
  const deny = Array.from(
    new Set((value.deny ?? []).map(normalizeCode).filter(isSubmoduleCode)),
  );

  return { allow, deny };
};

const emptySubmoduleActionModes = (): UserSubmoduleActionModes =>
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
    {} as UserSubmoduleActionModes,
  );

const isPermissionMode = (value: string): value is PermissionMode =>
  value === "allow" || value === "deny" || value === "inherit";

const sanitizeActionModes = (value: unknown): UserSubmoduleActionModes => {
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

export const readSubmodulePermissionOverrides = (): Record<
  string,
  SubmodulePermissionOverride
> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, SubmodulePermissionOverride>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, SubmodulePermissionOverride>>(
      (acc, [userId, override]) => {
        if (!userId) return acc;
        acc[String(userId)] = sanitizeOverride(override ?? {});
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

export const readUserSubmodulePermissionOverride = (
  userId: string,
): SubmodulePermissionOverride => {
  const all = readSubmodulePermissionOverrides();
  return all[String(userId)] ?? {};
};

export const saveUserSubmodulePermissionOverride = (
  userId: string,
  override: SubmodulePermissionOverride,
) => {
  if (typeof window === "undefined") return;
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) return;

  const all = readSubmodulePermissionOverrides();
  all[normalizedUserId] = sanitizeOverride(override);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

const readAllUserSubmoduleActionModes = (): Record<string, UserSubmoduleActionModes> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(ACTIONS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, UserSubmoduleActionModes>>(
      (acc, [userId, modes]) => {
        if (!userId) return acc;
        acc[String(userId)] = sanitizeActionModes(modes);
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

export const readUserSubmoduleActionModes = (
  userId: string,
): UserSubmoduleActionModes => {
  const all = readAllUserSubmoduleActionModes();
  return all[String(userId)] ?? emptySubmoduleActionModes();
};

export const saveUserSubmoduleActionModes = (
  userId: string,
  modes: UserSubmoduleActionModes,
) => {
  if (typeof window === "undefined") return;
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) return;

  const all = readAllUserSubmoduleActionModes();
  all[normalizedUserId] = sanitizeActionModes(modes);
  window.localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(all));
};
