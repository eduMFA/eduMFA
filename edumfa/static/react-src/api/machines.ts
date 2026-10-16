import type { ApiClient } from "./client";

/**
 * Typed port of the AngularJS `MachineFactory`. Calls the same `/machine` and
 * `/application` Flask endpoints with unchanged parameters.
 */

export interface MachineListParams {
  any?: string;
  hostname?: string;
  id?: string;
  ip?: string;
  resolver?: string;
}

export interface MachineDetail {
  hostname: string | string[] | null;
  id: string;
  ip: string | null;
  resolver_name: string;
  [key: string]: unknown;
}

export interface MachineTokenParams {
  application?: string;
  hostname?: string;
  machineid?: string;
  resolver?: string;
  serial?: string;
}

export interface MachineTokenAssignment {
  application: string;
  id: number;
  machine_id: string | null;
  options: Record<string, string>;
  resolver: string | null;
  serial: string;
  type?: string;
  [key: string]: unknown;
}

export interface MachineTokenAttachRequest {
  application: string;
  hostname?: string;
  machineid?: string;
  resolver?: string;
  serial: string;
  [key: string]: unknown;
}

export interface MachineTokenDetachRequest {
  application: string;
  mtid: number | string;
  serial: string;
}

export interface ApplicationOptionSpec {
  description?: string;
  required?: boolean;
  type?: string;
  value?: string[];
  [key: string]: unknown;
}

export type ApplicationDefinitions = Record<
  string,
  { options: Record<string, ApplicationOptionSpec>; [key: string]: unknown }
>;

export const machineQueryKeys = {
  all: ["machines"] as const,
  applicationDefinitions: ["machines", "application-definitions"] as const,
  list: (params?: MachineListParams) => ["machines", "list", params ?? {}] as const,
  tokens: (params?: MachineTokenParams) => ["machines", "tokens", params ?? {}] as const
};

export function getMachines(
  apiClient: ApiClient,
  params?: MachineListParams,
  signal?: AbortSignal
): Promise<MachineDetail[]> {
  return apiClient.get<MachineDetail[]>("/machine/", {
    params: { ...params },
    signal
  });
}

export function getMachineTokens(
  apiClient: ApiClient,
  params?: MachineTokenParams,
  signal?: AbortSignal
): Promise<MachineTokenAssignment[]> {
  return apiClient.get<MachineTokenAssignment[]>("/machine/token", {
    params: { ...params },
    signal
  });
}

export function attachTokenToMachine(
  apiClient: ApiClient,
  request: MachineTokenAttachRequest
): Promise<number> {
  return apiClient.post<number>("/machine/token", request);
}

export function detachTokenFromMachine(
  apiClient: ApiClient,
  request: MachineTokenDetachRequest
): Promise<number> {
  return apiClient.delete<number>(
    `/machine/token/${encodeURIComponent(request.serial)}/${encodeURIComponent(
      request.application
    )}/${encodeURIComponent(String(request.mtid))}`
  );
}

export function getApplicationDefinitions(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<ApplicationDefinitions> {
  return apiClient.get<ApplicationDefinitions>("/application/", { signal });
}

/**
 * `POST /machine/tokenoption`. The legacy view identified the assignment by
 * `mtid` only; an empty option value deletes that option.
 */
export function saveMachineTokenOptions(
  apiClient: ApiClient,
  request: { mtid: number | string; [key: string]: unknown }
): Promise<number> {
  return apiClient.post<number>("/machine/tokenoption", request);
}

/** Machine resolvers may report one hostname or a list of aliases. */
export function formatMachineHostname(hostname: MachineDetail["hostname"]): string {
  if (Array.isArray(hostname)) {
    return hostname.join(", ");
  }

  return hostname ?? "";
}
