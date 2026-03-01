import { create } from "zustand";
import type { AxiosError } from "axios";

import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import {
  MODULE_CODES,
  saveUserModuleActionModes,
  type PermissionMode,
  type UserModuleActionModes,
} from "@/app/auth/moduleActionPermissions";
import {
  saveUserSubmoduleActionModes,
  type UserSubmoduleActionModes,
} from "@/app/auth/submodulePermissionOverrides";
import { SUBMODULE_OPTIONS } from "@/app/auth/submoduleCatalog";
import { resetAllStores } from "@/store/resetAllStores";

const STORAGE_KEY = "picaflor.auth.session";
const SESSION_EXPIRED_MESSAGE = "Tu sesion expiro, vuelve a ingresar.";

export interface AuthUser {
  id: string;
  personalId: string;
  area: string;
  areaId?: string | null;
  username: string;
  displayName: string;
  companyId: string;
  companyName: string;
  allowedModules?: string[];
  allowedSubmodules?: string[];
  permissionsVersion?: number | null;
  rawAllowedModules?: string;
  rawAllowedSubmodules?: string;
  rawModuleActions?: string;
  rawSubmoduleActions?: string;
  permissionsFromLogin?: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
  fechaVencimientoClave: string;
  renovacionSome: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  id: string;
  personalId: string;
  area: string;
  areaId?: string;
  usuario: string;
  companiaId: string;
  razonSocial: string;
  token: string;
  expiresAtUtc?: string;
  expiresInSeconds?: number;
  fechaVencimientoClave?: string | null;
  FechaVencimientoClave?: string | null;
  renovacionSome?: string | null;
  RenovacionSome?: string | null;
  vencimientoSome?: string | null;
  VencimientoSome?: string | null;
  modulosPermitidosRaw?: string | null;
  subModulosPermitidosRaw?: string | null;
  moduleActionsRaw?: string | null;
  ModuleActionsRaw?: string | null;
  subModuleActionsRaw?: string | null;
  SubModuleActionsRaw?: string | null;
  modulosPermitidos?: string[] | null;
  subModulosPermitidos?: string[] | null;
  moduleActions?: string[] | null;
  subModuleActions?: string[] | null;
  permisosVersion?: string | number | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  passwordExpiryDate: string | null;
  someExpiryDate: string | null;
  passwordMustChange: boolean;
  someMustRenew: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<boolean>;
  logout: () => void;
  hydrate: () => void;
}

let sessionTimeoutId: number | null = null;

const isAuthSession = (value: unknown): value is AuthSession =>
  !!value &&
  typeof value === "object" &&
  "token" in value &&
  "user" in value &&
  "expiresAt" in value &&
  "fechaVencimientoClave" in value &&
  "renovacionSome" in value &&
  typeof (value as { renovacionSome?: unknown }).renovacionSome === "string" &&
  typeof (value as { token?: unknown }).token === "string";

const normalizeDateOnly = (value?: string | null): string | null => {
  const trimmed = String(value ?? "").trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return `${match[1]}-${match[2]}-${match[3]}`;
};

const normalizeList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

const parseRawList = (value?: string | null): string[] =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseRawActionList = (value?: string | null): string[] =>
  String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

const toPermissionMode = (value: string): PermissionMode =>
  value === "allow" || value === "deny" ? value : "inherit";

const defaultModuleActionModes = (): UserModuleActionModes =>
  MODULE_CODES.reduce(
    (acc, moduleCode) => {
      acc[moduleCode] = {
        read: "inherit",
        edit: "inherit",
        create: "inherit",
        delete: "inherit",
      };
      return acc;
    },
    {} as UserModuleActionModes,
  );

const parseModuleActionModes = (entries: string[]): UserModuleActionModes => {
  const modes = defaultModuleActionModes();
  const moduleCodeSet = new Set(MODULE_CODES);

  entries.forEach((entry) => {
    const [rawModuleCode, rawActions] = String(entry ?? "").split(":");
    const moduleCode = String(rawModuleCode ?? "").trim().toLowerCase();
    if (!moduleCodeSet.has(moduleCode as (typeof MODULE_CODES)[number])) return;

    const values = String(rawActions ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase());
    const target = modes[moduleCode as (typeof MODULE_CODES)[number]];
    target.read = toPermissionMode(values[0] ?? "inherit");
    target.edit = toPermissionMode(values[1] ?? "inherit");
    target.create = toPermissionMode(values[2] ?? "inherit");
    target.delete = toPermissionMode(values[3] ?? "inherit");
  });

  return modes;
};

const defaultSubmoduleActionModes = (): UserSubmoduleActionModes =>
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

const parseSubmoduleActionModes = (
  entries: string[],
): UserSubmoduleActionModes => {
  const modes = defaultSubmoduleActionModes();
  const submoduleCodeSet = new Set(
    SUBMODULE_OPTIONS.map((item) => String(item.code).trim().toLowerCase()),
  );

  entries.forEach((entry) => {
    const [rawSubmoduleCode, rawActions] = String(entry ?? "").split(":");
    const submoduleCode = String(rawSubmoduleCode ?? "").trim().toLowerCase();
    if (!submoduleCodeSet.has(submoduleCode)) return;

    const values = String(rawActions ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase());
    const target = modes[submoduleCode];
    if (!target) return;

    target.read = toPermissionMode(values[0] ?? "inherit");
    target.edit = toPermissionMode(values[1] ?? "inherit");
    target.create = toPermissionMode(values[2] ?? "inherit");
    target.delete = toPermissionMode(values[3] ?? "inherit");
  });

  return modes;
};

const parsePermissionsVersion = (
  value?: string | number | null,
): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isPasswordExpiredByDate = (expiryDate?: string | null): boolean => {
  const normalized = normalizeDateOnly(expiryDate);
  if (!normalized) return true;

  const [year, month, day] = normalized.split("-").map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime() >= expiry.getTime();
};

const readSessionFromStorage = (): AuthSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const persistSession = (session: AuthSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

const scheduleSessionExpiration = (expiresAt: number, onExpire: () => void) => {
  if (typeof window === "undefined") return;
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
  }

  const msUntilExpire = expiresAt - Date.now();
  if (msUntilExpire <= 0) {
    onExpire();
    return;
  }

  sessionTimeoutId = window.setTimeout(() => {
    onExpire();
  }, msUntilExpire);
};

export const useAuthStore = create<AuthState>((set, get) => {
  const storedSession = readSessionFromStorage();

  const isExpired = (expiresAt?: number | null) =>
    !expiresAt || expiresAt <= Date.now();

  const hasValidStoredSession =
    storedSession && !isExpired(storedSession.expiresAt);
  const storedPasswordExpiryDate = hasValidStoredSession
    ? normalizeDateOnly(storedSession?.fechaVencimientoClave)
    : null;
  const storedSomeExpiryDate = hasValidStoredSession
    ? normalizeDateOnly(storedSession?.renovacionSome ?? null)
    : null;
  const canRestoreStoredSession =
    !!hasValidStoredSession && !!storedPasswordExpiryDate && !!storedSomeExpiryDate;

  const logout = (reason?: string) => {
    if (sessionTimeoutId) {
      window.clearTimeout(sessionTimeoutId);
      sessionTimeoutId = null;
    }
    clearSession();
    resetAllStores();
    set({
      user: null,
      token: null,
      passwordExpiryDate: null,
      someExpiryDate: null,
      passwordMustChange: false,
      someMustRenew: false,
      isAuthenticated: false,
      error: reason ?? null,
      hydrated: true,
      loading: false,
    });
  };

  const hydrate = () => {
    if (get().hydrated) return;
    const session = readSessionFromStorage();
    const normalizedPasswordDate = normalizeDateOnly(
      session?.fechaVencimientoClave,
    );
    const normalizedSomeDate = normalizeDateOnly(session?.renovacionSome ?? null);
    if (session && !isExpired(session.expiresAt) && normalizedPasswordDate && normalizedSomeDate) {
      const someMustRenew = isPasswordExpiredByDate(normalizedSomeDate);
      set({
        user: session.user,
        token: session.token,
        passwordExpiryDate: normalizedPasswordDate,
        someExpiryDate: normalizedSomeDate,
        passwordMustChange: isPasswordExpiredByDate(normalizedPasswordDate),
        someMustRenew,
        isAuthenticated: true,
        hydrated: true,
      });
      scheduleSessionExpiration(session.expiresAt, () =>
        logout(SESSION_EXPIRED_MESSAGE),
      );
    } else {
      logout(session ? SESSION_EXPIRED_MESSAGE : undefined);
    }
  };

  return {
    user: canRestoreStoredSession ? storedSession?.user : null,
    token: canRestoreStoredSession ? storedSession?.token : null,
    passwordExpiryDate: canRestoreStoredSession ? storedPasswordExpiryDate : null,
    someExpiryDate: canRestoreStoredSession ? storedSomeExpiryDate : null,
    passwordMustChange: canRestoreStoredSession
      ? isPasswordExpiredByDate(storedPasswordExpiryDate)
      : false,
    someMustRenew: canRestoreStoredSession
      ? isPasswordExpiredByDate(storedSomeExpiryDate)
      : false,
    isAuthenticated: !!canRestoreStoredSession,
    hydrated: false,
    loading: false,
    error: null,

    hydrate,

    login: async ({ username, password }) => {
      const usernameSafe = (username ?? "").toString().trim();
      const passwordSafe = (password ?? "").toString().trim();

      if (!usernameSafe || !passwordSafe) {
        let message = "";

        if (!usernameSafe && !passwordSafe) {
          message = "Falta usuario y contraseña";
        } else if (!usernameSafe) {
          message = "Falta usuario";
        } else {
          message = "Falta contraseña";
        }

        set({
          loading: false,
          error: message,
          isAuthenticated: false,
        });

        return false;
      }

      set({ loading: true, error: null });

      let parsed: LoginResponse | null = null;
      try {
        const response = await apiRequest<LoginResponse, unknown, null>({
          url: `${API_BASE_URL}/User/acceso`,
          method: "POST",
          data: {
            email: usernameSafe,
            password: passwordSafe,
          },
          fallback: null,
        });
        parsed = response as LoginResponse | null;
      } catch (error: unknown) {
        let message = "Error de comunicación con el servidor";
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) {
            message = "Credenciales incorrectas";
          } else if (status && status >= 500) {
            message = "El servidor no responde. Intenta de nuevo más tarde.";
          }
        } else if (error instanceof Error) {
          message = error.message;
        }
        set({
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          passwordExpiryDate: null,
          someExpiryDate: null,
          passwordMustChange: false,
          someMustRenew: false,
          error: message,
          hydrated: true,
        });
        return false;
      }

      if (parsed === null) {
        set({
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          passwordExpiryDate: null,
          someExpiryDate: null,
          passwordMustChange: false,
          someMustRenew: false,
          error: "El servidor no responde. Intenta de nuevo más tarde.",
          hydrated: true,
        });
        return false;
      }

      if (typeof parsed !== "object" || !parsed.token) {
        set({
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          passwordExpiryDate: null,
          someExpiryDate: null,
          passwordMustChange: false,
          someMustRenew: false,
          error: "Credenciales incorrectas",
          hydrated: true,
        });
        return false;
      }

      const rawPasswordExpiryDate =
        parsed.fechaVencimientoClave ?? parsed.FechaVencimientoClave ?? null;
      const passwordExpiryDate = normalizeDateOnly(rawPasswordExpiryDate);
      if (!passwordExpiryDate) {
        set({
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          passwordExpiryDate: null,
          someExpiryDate: null,
          passwordMustChange: false,
          someMustRenew: false,
          error: "No se recibio fecha de vencimiento de clave.",
          hydrated: true,
        });
        return false;
      }
      const rawSomeExpiryDate =
        parsed.renovacionSome ??
        parsed.RenovacionSome ??
        parsed.vencimientoSome ??
        parsed.VencimientoSome ??
        null;
      const someExpiryDate = normalizeDateOnly(rawSomeExpiryDate);
      if (!someExpiryDate) {
        set({
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          passwordExpiryDate: null,
          someExpiryDate: null,
          passwordMustChange: false,
          someMustRenew: false,
          error: "No se recibio fecha de vencimiento SOME.",
          hydrated: true,
        });
        return false;
      }

      const expiresAt =
        (parsed.expiresAtUtc ? Date.parse(parsed.expiresAtUtc) : null) ??
        (parsed.expiresInSeconds
          ? Date.now() + parsed.expiresInSeconds * 1000
          : null);

      const session: AuthSession = {
        token: parsed.token,
        expiresAt: expiresAt ?? Date.now() + 5 * 60 * 1000,
        fechaVencimientoClave: passwordExpiryDate,
        renovacionSome: someExpiryDate,
        user: {
          id: parsed.id,
          personalId: parsed.personalId,
          area: parsed.area,
          areaId: parsed.areaId ?? null,
          username: usernameSafe,
          displayName: parsed.usuario ?? usernameSafe,
          companyId: parsed.companiaId,
          companyName: parsed.razonSocial,
          rawAllowedModules: String(parsed.modulosPermitidosRaw ?? "").trim(),
          rawAllowedSubmodules: String(
            parsed.subModulosPermitidosRaw ?? "",
          ).trim(),
          rawModuleActions: String(
            parsed.moduleActionsRaw ?? parsed.ModuleActionsRaw ?? "",
          ).trim(),
          rawSubmoduleActions: String(
            parsed.subModuleActionsRaw ?? parsed.SubModuleActionsRaw ?? "",
          ).trim(),
          allowedModules: (() => {
            const arrayPayload = normalizeList(parsed.modulosPermitidos);
            if (arrayPayload.length > 0) return arrayPayload;
            return parseRawList(parsed.modulosPermitidosRaw);
          })(),
          allowedSubmodules: (() => {
            const arrayPayload = normalizeList(parsed.subModulosPermitidos);
            if (arrayPayload.length > 0) return arrayPayload;
            return parseRawList(parsed.subModulosPermitidosRaw);
          })(),
          permissionsVersion: parsePermissionsVersion(parsed.permisosVersion),
          permissionsFromLogin: true,
        },
      };

      const moduleActionEntries = (() => {
        const arrayPayload = normalizeList(parsed.moduleActions);
        if (arrayPayload.length > 0) return arrayPayload;
        return parseRawActionList(parsed.moduleActionsRaw ?? parsed.ModuleActionsRaw);
      })();
      const submoduleActionEntries = (() => {
        const arrayPayload = normalizeList(parsed.subModuleActions);
        if (arrayPayload.length > 0) return arrayPayload;
        return parseRawActionList(
          parsed.subModuleActionsRaw ?? parsed.SubModuleActionsRaw,
        );
      })();

      saveUserModuleActionModes(
        session.user.id,
        parseModuleActionModes(moduleActionEntries),
      );
      saveUserSubmoduleActionModes(
        session.user.id,
        parseSubmoduleActionModes(submoduleActionEntries),
      );

      persistSession(session);

      const someMustRenew = someExpiryDate
        ? isPasswordExpiredByDate(someExpiryDate)
        : false;
      set({
        loading: false,
        isAuthenticated: true,
        user: session.user,
        token: session.token,
        passwordExpiryDate: session.fechaVencimientoClave,
        someExpiryDate,
        passwordMustChange: isPasswordExpiredByDate(session.fechaVencimientoClave),
        someMustRenew,
        hydrated: true,
        error: null,
      });

      scheduleSessionExpiration(session.expiresAt, () =>
        logout(SESSION_EXPIRED_MESSAGE),
      );

      return true;
    },

    logout: () => logout(),
  };
});

