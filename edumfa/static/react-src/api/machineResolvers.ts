import type { ApiClient } from "./client";
import type { EduMfaSuccessEnvelope } from "./envelope";

/**
 * Port of the machine resolver calls of the AngularJS `ConfigFactory`
 * (`getMachineResolvers`, `getMachineResolver`, `setMachineResolver`,
 * `delMachineResolver`, `testMachineResolver`). The endpoints and payload
 * keys are unchanged.
 */

/** The types the legacy controller offered (`availableMachineResolverTypes`). */
export const machineResolverTypes = ["hosts", "ldap"] as const;

export type MachineResolverType = (typeof machineResolverTypes)[number];

export interface MachineResolverConfig {
  /** The type specific keys; passwords are delivered decrypted. */
  data: Record<string, unknown>;
  resolvername: string;
  type: string;
}

/** `GET /machineresolver/` and `GET /machineresolver/<name>`: resolvers keyed by name. */
export type MachineResolversResponse = Record<string, MachineResolverConfig>;

/**
 * Body of `POST /machineresolver/<name>` and `POST /machineresolver/test`:
 * the type plus the type specific keys (`filename` for hosts, the LDAP keys
 * in upper case).
 */
export interface MachineResolverRequest {
  type: string;
  [key: string]: unknown;
}

export interface MachineResolverTestResult {
  /** `detail.description` of the test response, shown as notification. */
  description: string;
  success: boolean;
}

export const machineResolverQueryKeys = {
  all: ["machineresolvers"] as const,
  detail: (resolverName: string) =>
    ["machineresolvers", "detail", resolverName] as const,
  list: ["machineresolvers", "list"] as const
};

export function getMachineResolvers(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<MachineResolversResponse> {
  return apiClient.get<MachineResolversResponse>("/machineresolver/", { signal });
}

export function getMachineResolver(
  apiClient: ApiClient,
  resolverName: string,
  signal?: AbortSignal
): Promise<MachineResolversResponse> {
  return apiClient.get<MachineResolversResponse>(
    `/machineresolver/${encodeURIComponent(resolverName)}`,
    { signal }
  );
}

/** Creates or updates a resolver; the value is the database id. */
export function saveMachineResolver(
  apiClient: ApiClient,
  resolverName: string,
  request: MachineResolverRequest
): Promise<number> {
  return apiClient.post<number>(
    `/machineresolver/${encodeURIComponent(resolverName)}`,
    request
  );
}

export function deleteMachineResolver(
  apiClient: ApiClient,
  resolverName: string
): Promise<number> {
  return apiClient.delete<number>(
    `/machineresolver/${encodeURIComponent(resolverName)}`
  );
}

/**
 * `POST /machineresolver/test`: the backend answers with a boolean value and
 * the human readable outcome in `detail.description`, so the whole envelope
 * is read.
 */
export async function testMachineResolver(
  apiClient: ApiClient,
  request: MachineResolverRequest
): Promise<MachineResolverTestResult> {
  const envelope = await apiClient.post<EduMfaSuccessEnvelope<boolean>>(
    "/machineresolver/test",
    request,
    { responseType: "envelope" }
  );
  const description = envelope.detail?.description;

  return {
    description: typeof description === "string" ? description : "",
    success: envelope.result.value
  };
}
