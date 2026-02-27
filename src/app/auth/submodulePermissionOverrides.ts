import { SUBMODULE_OPTIONS } from "./submoduleCatalog";

export type SubmodulePermissionOverride = {
  allow?: string[];
  deny?: string[];
};

const STORAGE_KEY = "picaflor.permissions.submodule-overrides";

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

