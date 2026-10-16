import type { ApiClient } from "./client";

/**
 * Partial port of the AngularJS `ConfigFactory`. Only the pieces needed by
 * migrated routes are ported; the broad admin config surface stays in
 * Angular until `#/config/**` is migrated.
 */

export interface RealmResolver {
  name: string;
  node: string;
  priority: number | null;
  type: string;
}

export interface Realm {
  default?: boolean;
  id?: number;
  option?: string;
  resolver: RealmResolver[];
  [key: string]: unknown;
}

export type RealmsResponse = Record<string, Realm>;

export interface ResolverConfig {
  censor_keys?: string[];
  data: Record<string, unknown>;
  editable?: boolean;
  resolvername: string;
  type: string;
  [key: string]: unknown;
}

export type ResolversResponse = Record<string, ResolverConfig>;

export interface ResolverListParams {
  /** Only return resolvers flagged as editable user stores. */
  editable?: boolean;
}

export const configQueryKeys = {
  all: ["config"] as const,
  realms: ["config", "realms"] as const,
  resolver: (resolverName: string) => ["config", "resolver", resolverName] as const,
  resolvers: (params?: ResolverListParams) =>
    ["config", "resolvers", params ?? {}] as const
};

export function getRealms(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<RealmsResponse> {
  return apiClient.get<RealmsResponse>("/realm/", { signal });
}

export function getDefaultRealmName(realms: RealmsResponse): string | null {
  const realmNames = Object.keys(realms);

  if (realmNames.length === 1) {
    return realmNames[0] ?? null;
  }

  const defaultRealm = realmNames.find((realmName) => realms[realmName]?.default);

  return defaultRealm ?? null;
}

/**
 * `GET /resolver/`. The backend expects the literal string "1" for the
 * editable filter, like the legacy `getEditableResolvers` call sent.
 */
export function getResolvers(
  apiClient: ApiClient,
  params?: ResolverListParams,
  signal?: AbortSignal
): Promise<ResolversResponse> {
  return apiClient.get<ResolversResponse>("/resolver/", {
    params: params?.editable ? { editable: "1" } : {},
    signal
  });
}

export function getResolver(
  apiClient: ApiClient,
  resolverName: string,
  signal?: AbortSignal
): Promise<ResolversResponse> {
  return apiClient.get<ResolversResponse>(
    `/resolver/${encodeURIComponent(resolverName)}`,
    { signal }
  );
}
