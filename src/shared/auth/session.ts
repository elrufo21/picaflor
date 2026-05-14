export const AUTH_STORAGE_KEY = "picaflor.auth.session.v2";
const LEGACY_AUTH_STORAGE_KEYS = ["picaflor.auth.session"];

type StoredSessionLike = {
  token?: unknown;
  expiresAt?: unknown;
  expiresAtUtc?: unknown;
  expiresInSeconds?: unknown;
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseSessionExpiryFromUtc = (
  expiresAtUtc?: string | null,
): number | null => {
  const raw = String(expiresAtUtc ?? "").trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export const resolveSessionExpiryTs = (
  session?: StoredSessionLike | null,
): number | null => {
  if (!session || typeof session !== "object") return null;

  const utcExpiry = parseSessionExpiryFromUtc(
    typeof session.expiresAtUtc === "string" ? session.expiresAtUtc : null,
  );
  if (utcExpiry !== null) return utcExpiry;

  return toFiniteNumber(session.expiresAt);
};

export const readStoredSession = (): StoredSessionLike | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as StoredSessionLike;
  } catch {
    return null;
  }
};

export const clearStoredSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  LEGACY_AUTH_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

export const clearLegacyStoredSessions = () => {
  if (typeof window === "undefined") return;
  LEGACY_AUTH_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

export const isStoredSessionExpired = (session?: StoredSessionLike | null) => {
  const expiryTs = resolveSessionExpiryTs(session);
  if (expiryTs === null) return false;
  return Date.now() >= expiryTs;
};
