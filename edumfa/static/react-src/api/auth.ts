import type { ApiClient } from "./client";

export interface AuthLoginRequest {
  password?: string;
  realm?: string;
  response?: string;
  transaction_id?: string;
  username: string;
}

export interface AuthLoginResponse {
  log_level?: number;
  menus: string[];
  realm: string;
  rights: string[];
  role: string;
  token?: string;
  username: string;
}

export type AuthRightsResponse = string[];

export function login(
  apiClient: ApiClient,
  request: AuthLoginRequest,
  signal?: AbortSignal
): Promise<AuthLoginResponse> {
  return apiClient.post<AuthLoginResponse>("/auth", request, { signal });
}

export function getAuthRights(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<AuthRightsResponse> {
  return apiClient.get<AuthRightsResponse>("/auth/rights", { signal });
}
