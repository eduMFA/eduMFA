import type { ApiClient } from "./client";

/**
 * Port of the realm calls of the AngularJS `ConfigFactory` (`setRealm`,
 * `delRealm`, `setDefaultRealm`, `clearDefaultRealm`). `getRealms` and the
 * realm types live in `./config`.
 */

/** One entry of the legacy `selectedResolvers` map. */
export interface RealmResolverSelection {
  priority: number | null;
  selected: boolean;
}

export type RealmResolverSelections = Record<string, RealmResolverSelection>;

/**
 * Body of `POST /realm/<name>`: the resolver names as comma separated list
 * plus one `priority.<resolver>` key per prioritised resolver. The backend
 * only accepts integer priorities, so they are sent as numbers.
 */
export interface RealmRequest {
  resolvers: string;
  [priorityKey: `priority.${string}`]: number;
}

export interface RealmSaveResult {
  added: string[];
  failed: string[];
}

/** Port of the legacy `setRealm` payload construction. */
export function buildRealmRequest(selections: RealmResolverSelections): RealmRequest {
  const resolvers: string[] = [];
  const request: RealmRequest = { resolvers: "" };

  Object.entries(selections).forEach(([resolverName, selection]) => {
    if (!selection.selected) {
      return;
    }

    resolvers.push(resolverName);

    if (selection.priority !== null) {
      request[`priority.${resolverName}`] = selection.priority;
    }
  });

  request.resolvers = resolvers.join(",");

  return request;
}

export function setRealm(
  apiClient: ApiClient,
  realmName: string,
  request: RealmRequest
): Promise<RealmSaveResult> {
  return apiClient.post<RealmSaveResult>(
    `/realm/${encodeURIComponent(realmName)}`,
    request
  );
}

export function deleteRealm(apiClient: ApiClient, realmName: string): Promise<number> {
  return apiClient.delete<number>(`/realm/${encodeURIComponent(realmName)}`);
}

/** The legacy factory posted an empty JSON object. */
export function setDefaultRealm(
  apiClient: ApiClient,
  realmName: string
): Promise<boolean | number> {
  return apiClient.post<boolean | number>(
    `/defaultrealm/${encodeURIComponent(realmName)}`,
    {}
  );
}

export function clearDefaultRealm(apiClient: ApiClient): Promise<boolean | number> {
  return apiClient.delete<boolean | number>("/defaultrealm");
}
