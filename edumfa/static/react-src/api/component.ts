import type { ApiClient } from "./client";

export interface ClientApplication {
  hostname: string | null;
  ip: string;
  lastseen: string | null;
}

export type ClientApplicationsByType = Record<string, ClientApplication[]>;

export function getClientApplications(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<ClientApplicationsByType> {
  return apiClient.get<ClientApplicationsByType>("/client/", { signal });
}
