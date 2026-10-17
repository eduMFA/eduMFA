import type { ApiClient } from "./client";
import { getResolvers, type ResolversResponse } from "./config";
import type { EduMfaSuccessEnvelope } from "./envelope";

/**
 * The user resolver part of the AngularJS `ConfigFactory` that `api/config.ts`
 * does not cover: saving, deleting and testing resolvers. Same `/resolver`
 * endpoints and payload keys as the legacy factory.
 */

/** The resolver types the legacy config controller offered (`availableResolverTypes`). */
export const resolverTypes = [
  "passwdresolver",
  "ldapresolver",
  "sqlresolver",
  "scimresolver",
  "httpresolver"
] as const;

export type ResolverType = (typeof resolverTypes)[number];

/** Body of `POST /resolver/<name>`: the type plus the type's configuration keys. */
export interface ResolverWriteRequest {
  type: ResolverType;
  [key: string]: unknown;
}

/**
 * Body of `POST /resolver/test`. `resolver` names an existing resolver so the
 * backend can fill in secrets that were delivered as `__CENSORED__`.
 */
export interface ResolverTestRequest extends ResolverWriteRequest {
  resolver?: string;
}

export interface ResolverTestResult {
  /** `detail.description`: the human readable outcome. */
  description: string;
  /**
   * `result.value`: `true`/`false` for most types; the SQL resolver answers
   * the number of users it found, or -1 when the connection failed.
   */
  value: boolean | number | null;
}

export const resolverQueryKeys = {
  /** Prefix of `configQueryKeys.resolver(name)`, for invalidation. */
  details: ["config", "resolver"] as const,
  /** Prefix of `configQueryKeys.resolvers(params)`, for invalidation. */
  lists: ["config", "resolvers"] as const
};

/** `GET /resolver/?editable=1`, the legacy `getEditableResolvers`. */
export function getEditableResolvers(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<ResolversResponse> {
  return getResolvers(apiClient, { editable: true }, signal);
}

/** `POST /resolver/<name>`; answers the database id of the resolver. */
export function setResolver(
  apiClient: ApiClient,
  resolverName: string,
  request: ResolverWriteRequest
): Promise<number> {
  return apiClient.post<number>(
    `/resolver/${encodeURIComponent(resolverName)}`,
    request
  );
}

/** `DELETE /resolver/<name>`; answers the id of the deleted resolver. */
export function deleteResolver(
  apiClient: ApiClient,
  resolverName: string
): Promise<number> {
  return apiClient.delete<number>(`/resolver/${encodeURIComponent(resolverName)}`);
}

/** `POST /resolver/test`; the description lives next to the value in `detail`. */
export async function testResolver(
  apiClient: ApiClient,
  request: ResolverTestRequest
): Promise<ResolverTestResult> {
  const envelope = await apiClient.post<EduMfaSuccessEnvelope<boolean | number | null>>(
    "/resolver/test",
    request,
    { responseType: "envelope" }
  );
  const description = envelope.detail?.description;

  return {
    description: typeof description === "string" ? description : "",
    value: envelope.result.value
  };
}

/**
 * The legacy controllers treated `true` (LDAP, SCIM, HTTP) and any
 * non-negative user count (SQL) as a successful test.
 */
export function isResolverTestSuccess(value: ResolverTestResult["value"]): boolean {
  return value === true || (typeof value === "number" && value >= 0);
}

/** Port of the legacy global `isTrue`: the spellings a stored flag may have. */
export function isResolverFlagSet(value: unknown): boolean {
  return value === true || value === "1" || value === "true" || value === "True";
}
