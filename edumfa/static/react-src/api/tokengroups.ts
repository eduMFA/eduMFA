import type { ApiClient } from "./client";
import { configQueryKeys, type TokengroupsResponse } from "./config";

/**
 * Port of the token group calls of the AngularJS `ConfigFactory`
 * (`getTokengroup`, `addTokengroup`, `delTokengroup`). The list call
 * `getTokengroups` lives in `api/config.ts`, shared with the token views.
 */

/** `POST /tokengroup/<groupname>`: the legacy form posted all its values. */
export interface TokengroupWriteRequest {
  description: string;
  groupname: string;
  /** Present when editing; the backend ignores it. */
  id?: number;
}

export const tokengroupQueryKeys = {
  /** The list key of `api/config.ts`, so invalidating it refreshes every consumer. */
  all: configQueryKeys.tokengroups,
  detail: (groupName: string) => [...configQueryKeys.tokengroups, groupName] as const
};

/** Answers with a dict keyed by name, like the list call. */
export function getTokengroup(
  apiClient: ApiClient,
  groupName: string,
  signal?: AbortSignal
): Promise<TokengroupsResponse> {
  return apiClient.get<TokengroupsResponse>(
    `/tokengroup/${encodeURIComponent(groupName)}`,
    { signal }
  );
}

export function saveTokengroup(
  apiClient: ApiClient,
  request: TokengroupWriteRequest
): Promise<number> {
  return apiClient.post<number>(
    `/tokengroup/${encodeURIComponent(request.groupname)}`,
    request
  );
}

export function deleteTokengroup(
  apiClient: ApiClient,
  groupName: string
): Promise<number> {
  return apiClient.delete<number>(`/tokengroup/${encodeURIComponent(groupName)}`);
}
