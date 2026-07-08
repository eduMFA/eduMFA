export interface LegacyU2fApi {
  register: (
    appId: string,
    registerRequests: readonly unknown[],
    registeredKeys: readonly unknown[],
    callback: (response: unknown) => void,
    timeoutSeconds?: number
  ) => void;
  sign: (
    appId: string,
    challenge: string,
    registeredKeys: readonly unknown[],
    callback: (response: unknown) => void,
    timeoutSeconds?: number
  ) => void;
}

export function getLegacyU2fApi(win: Window = window): LegacyU2fApi | null {
  const candidate = (win as Window & { u2f?: unknown }).u2f;

  return isLegacyU2fApi(candidate) ? candidate : null;
}

function isLegacyU2fApi(candidate: unknown): candidate is LegacyU2fApi {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }

  const record = candidate as Record<string, unknown>;

  return typeof record.register === "function" && typeof record.sign === "function";
}
