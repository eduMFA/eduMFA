import type { ApiClient } from "./client";

/**
 * Port of the CA connector calls of the AngularJS `ConfigFactory`
 * (`getCAConnectors`, `getCAConnector`, `setCAConnector`, `delCAConnector`
 * and `getCASpecificOptions`). The connector names from
 * `GET /system/names/caconnector` stay in `api/config.ts`.
 */

/** The connector types the backend ships (`get_caconnector_types`). */
export type CaConnectorType = "local" | "microsoft";

/** One entry of `GET /caconnector/`: the name, the type and the stored config. */
export interface CaConnector {
  connectorname: string;
  /** The connector's config keys; flags come back as booleans. */
  data: Record<string, unknown>;
  /** Certificate templates by name, as far as the connector knows them. */
  templates?: Record<string, unknown>;
  type: string;
  [key: string]: unknown;
}

/** A value of a connector form; the checkboxes contribute booleans. */
export type CaConnectorParamValue = boolean | number | string;

export type CaConnectorParams = Record<string, CaConnectorParamValue>;

/** `POST /caconnector/<name>`: the type plus the connector's own keys. */
export type CaConnectorWriteRequest = CaConnectorParams & { type: string };

/** `GET /caconnector/specific/<type>`: what the CA offers, e.g. the domain CAs. */
export interface CaSpecificOptions {
  available_cas?: string[];
  [key: string]: unknown;
}

export const caConnectorQueryKeys = {
  all: ["caconnectors"] as const,
  detail: (connectorName: string) => ["caconnectors", "detail", connectorName] as const,
  list: ["caconnectors", "list"] as const,
  specificOptions: (connectorType: string, params: CaConnectorParams) =>
    ["caconnectors", "specific", connectorType, params] as const
};

export function getCaConnectors(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<CaConnector[]> {
  return apiClient.get<CaConnector[]>("/caconnector/", { signal });
}

/**
 * `GET /caconnector/<name>` answers with the list filtered by name, so an
 * unknown name yields an empty list; the legacy controller read `[0]`.
 */
export function getCaConnector(
  apiClient: ApiClient,
  connectorName: string,
  signal?: AbortSignal
): Promise<CaConnector[]> {
  return apiClient.get<CaConnector[]>(
    `/caconnector/${encodeURIComponent(connectorName)}`,
    { signal }
  );
}

/** Creates or updates the connector; the backend returns its database id. */
export function saveCaConnector(
  apiClient: ApiClient,
  connectorName: string,
  request: CaConnectorWriteRequest
): Promise<number> {
  return apiClient.post<number>(
    `/caconnector/${encodeURIComponent(connectorName)}`,
    request
  );
}

export function deleteCaConnector(
  apiClient: ApiClient,
  connectorName: string
): Promise<number> {
  return apiClient.delete<number>(`/caconnector/${encodeURIComponent(connectorName)}`);
}

/**
 * Asks a connector type for its instance-specific options with the current
 * form values as query string, like the legacy `URLSearchParams(params)`.
 */
export function getCaSpecificOptions(
  apiClient: ApiClient,
  connectorType: string,
  params: CaConnectorParams,
  signal?: AbortSignal
): Promise<CaSpecificOptions> {
  return apiClient.get<CaSpecificOptions>(
    `/caconnector/specific/${encodeURIComponent(connectorType)}`,
    { params, signal }
  );
}
