import {
  resolverTypes,
  type ResolverType,
  type ResolverWriteRequest
} from "@/api/resolvers";

/**
 * Route segment of each editor below `/config/resolvers/`, taken from the
 * legacy `config.resolvers.add*` state URLs. (The legacy SQL edit state
 * wrongly reused `/ldap`; the React routes use `/sql` for both.)
 */
export const resolverRouteSegments: Record<ResolverType, string> = {
  httpresolver: "httpresolver",
  ldapresolver: "ldap",
  passwdresolver: "passwd",
  scimresolver: "scim",
  sqlresolver: "sql"
};

/** Path of the "new" editor, or of the edit page when a name is given. */
export function resolverEditorPath(type: ResolverType, resolverName?: string): string {
  const base = `/config/resolvers/${resolverRouteSegments[type]}`;

  return resolverName ? `${base}/${encodeURIComponent(resolverName)}` : base;
}

export function isResolverType(value: unknown): value is ResolverType {
  return resolverTypes.some((type) => type === value);
}

/** The legacy `resourceNamePatterns.simple`. */
export const resolverNamePattern = /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/;

export type ResolverNameError = "pattern" | "reserved";

/**
 * Inline validation of the resolver name. "test" is refused because
 * `POST /resolver/test` is the connection test endpoint (the legacy forms
 * used the `withoutTest` pattern for that reason). An empty name is not an
 * error here; it only keeps the form invalid.
 */
export function getResolverNameError(name: string): ResolverNameError | null {
  if (name === "test") {
    return "reserved";
  }

  if (name !== "" && !resolverNamePattern.test(name)) {
    return "pattern";
  }

  return null;
}

export function isResolverNameValid(name: string): boolean {
  return name !== "" && getResolverNameError(name) === null;
}

/** A stored config value as input text; missing or structured values are empty. */
export function toText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

/**
 * Builds the `POST /resolver/<name>` body like the legacy `$scope.params`:
 * the stored configuration (so censored secrets and keys the form does not
 * know are sent back unchanged) overlaid with the form fields. A field
 * nobody filled in stays out of the request, as it was `undefined` in the
 * legacy model; a stored value the user cleared is sent as "" so that the
 * backend overwrites it.
 */
export function buildResolverPayload(
  type: ResolverType,
  fields: Record<string, unknown>,
  storedData: Record<string, unknown> | null
): ResolverWriteRequest {
  const payload: Record<string, unknown> = { ...storedData };

  Object.entries(fields).forEach(([key, value]) => {
    if (value === "" && !(storedData && key in storedData)) {
      return;
    }

    payload[key] = value;
  });

  return { ...payload, type };
}
