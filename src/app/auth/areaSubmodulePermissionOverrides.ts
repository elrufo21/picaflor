import { SUBMODULE_OPTIONS } from "./submoduleCatalog";

export type AreaSubmodulePermissionOverride = {
  allow?: string[];
  deny?: string[];
};

const STORAGE_KEY = "picaflor.permissions.area-submodule-overrides";

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

