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

export interface Tokengroup {
  description?: string;
  id?: number;
  [key: string]: unknown;
}

export type TokengroupsResponse = Record<string, Tokengroup>;

/** `GET /system/`: the config entries the current role may read. */
export type SystemConfig = Record<string, unknown>;

/** One entry of `GET /policy/`; only the fields the dashboard needs are typed. */
export interface PolicySummary {
  action?: Record<string, unknown> | string;
  active: boolean;
  name: string;
  scope: string;
  [key: string]: unknown;
}

/** One entry of `GET /event/`. */
export interface EventSummary {
  active: boolean;
  event: string[];
  handlermodule: string;
  id: number;
  name: string;
  [key: string]: unknown;
}

/** `GET /system/gpgkeys`: public keys the token import can decrypt with. */
export type PgpKeys = Record<string, { armor: string; fingerprint: string }>;

/** One entry of `GET /system/names/caconnector`. */
export interface CaConnectorName {
  connectorname: string;
  /** Certificate templates by name; the value describes the template. */
  templates?: Record<string, unknown>;
  type?: string;
  [key: string]: unknown;
}

/** `GET /serviceid/`: service identifiers for application specific passwords. */
export type ServiceIds = Record<string, { description?: string; id?: number }>;

/** One entry of `GET /edumfaserver/`, keyed by identifier. */
export interface EduMfaServer {
  description?: string;
  id: number;
  tls?: boolean;
  url?: string;
  [key: string]: unknown;
}

export type EduMfaServers = Record<string, EduMfaServer>;

export const configQueryKeys = {
  all: ["config"] as const,
  caConnectorNames: ["config", "caconnector-names"] as const,
  eduMfaServers: ["config", "edumfa-servers"] as const,
  events: ["config", "events"] as const,
  pgpKeys: ["config", "pgp-keys"] as const,
  policies: ["config", "policies"] as const,
  radiusNames: ["config", "radius-names"] as const,
  realms: ["config", "realms"] as const,
  serviceIds: ["config", "service-ids"] as const,
  system: ["config", "system"] as const,
  tokengroups: ["config", "tokengroups"] as const,
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

export function getTokengroups(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<TokengroupsResponse> {
  return apiClient.get<TokengroupsResponse>("/tokengroup/", { signal });
}

export function getSystemConfig(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<SystemConfig> {
  return apiClient.get<SystemConfig>("/system/", { signal });
}

/** Port of the legacy `isChecked`: the spellings the config uses for "on". */
export function isConfigEnabled(value: unknown): boolean {
  return [true, 1, "1", "True", "true", "TRUE"].includes(value as never);
}

export function getPolicies(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<PolicySummary[]> {
  return apiClient.get<PolicySummary[]>("/policy/", { signal });
}

export function getEvents(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<EventSummary[]> {
  return apiClient.get<EventSummary[]>("/event/", { signal });
}

export function getPgpKeys(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<PgpKeys> {
  return apiClient.get<PgpKeys>("/system/gpgkeys", { signal });
}

/** Requires the `enrollCERTIFICATE` right; only called for that token type. */
export function getCaConnectorNames(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<CaConnectorName[]> {
  return apiClient.get<CaConnectorName[]>("/system/names/caconnector", { signal });
}

/** Requires the `enrollRADIUS` right; only called for that token type. */
export function getRadiusNames(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>("/system/names/radius", { signal });
}

export function getServiceIds(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<ServiceIds> {
  return apiClient.get<ServiceIds>("/serviceid/", { signal });
}

export function getEduMfaServers(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<EduMfaServers> {
  return apiClient.get<EduMfaServers>("/edumfaserver/", { signal });
}
