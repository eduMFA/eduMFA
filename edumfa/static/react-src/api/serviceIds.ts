import type { ApiClient } from "./client";
import { configQueryKeys, type ServiceIds } from "./config";

/**
 * Port of the service ID calls of the AngularJS `ConfigFactory`
 * (`getServiceid`, `addServiceid`, `delServiceid`). The list call
 * `getServiceIds` lives in `api/config.ts`, shared with the machine views.
 */

/** One entry of `GET /serviceid/`. */
export type ServiceId = ServiceIds[string];

/** `POST /serviceid/<servicename>`: the legacy form posted all its values. */
export interface ServiceIdWriteRequest {
  description: string;
  /** Present when editing; the backend ignores it. */
  id?: number;
  servicename: string;
}

export const serviceIdQueryKeys = {
  /** The list key of `api/config.ts`, so invalidating it refreshes every consumer. */
  all: configQueryKeys.serviceIds,
  detail: (serviceName: string) => [...configQueryKeys.serviceIds, serviceName] as const
};

/** Answers with a dict keyed by name, like the list call. */
export function getServiceId(
  apiClient: ApiClient,
  serviceName: string,
  signal?: AbortSignal
): Promise<ServiceIds> {
  return apiClient.get<ServiceIds>(`/serviceid/${encodeURIComponent(serviceName)}`, {
    signal
  });
}

export function saveServiceId(
  apiClient: ApiClient,
  request: ServiceIdWriteRequest
): Promise<number> {
  return apiClient.post<number>(
    `/serviceid/${encodeURIComponent(request.servicename)}`,
    request
  );
}

export function deleteServiceId(
  apiClient: ApiClient,
  serviceName: string
): Promise<number> {
  return apiClient.delete<number>(`/serviceid/${encodeURIComponent(serviceName)}`);
}
