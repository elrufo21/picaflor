import { create } from "zustand";
import type { AxiosError } from "axios";

import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
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
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
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
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
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
  typeof (value as any).token === "string";

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
      isAuthenticated: false,
      error: reason ?? null,
      hydrated: true,
      loading: false,
    });
  };

  const hydrate = () => {
    if (get().hydrated) return;
    const session = readSessionFromStorage();
    if (session && !isExpired(session.expiresAt)) {
      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        hydrated: true,
      });
      scheduleSessionExpiration(session.expiresAt, () =>
        logout(SESSION_EXPIRED_MESSAGE)
      );
    } else {
      logout(session ? SESSION_EXPIRED_MESSAGE : undefined);
    }
  };

  return {
    user: hasValidStoredSession ? storedSession?.user : null,
    token: hasValidStoredSession ? storedSession?.token : null,
    isAuthenticated: !!hasValidStoredSession,
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
            message =
              "El servidor no responde. Intenta de nuevo más tarde.";
          }
        } else if (error instanceof Error) {
          message = error.message;
        }
        set({
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null,
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
          error: "Credenciales incorrectas",
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
        user: {
          id: parsed.id,
          personalId: parsed.personalId,
          area: parsed.area,
          areaId: parsed.areaId ?? null,
          username: usernameSafe,
          displayName: parsed.usuario ?? usernameSafe,
          companyId: parsed.companiaId,
          companyName: parsed.razonSocial,
        },
      };

      persistSession(session);

      set({
        loading: false,
        isAuthenticated: true,
        user: session.user,
        token: session.token,
        hydrated: true,
        error: null,
      });

      scheduleSessionExpiration(session.expiresAt, () =>
        logout(SESSION_EXPIRED_MESSAGE)
      );

      return true;
    },

    logout: () => logout(),
  };
});
