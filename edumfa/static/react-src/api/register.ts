import type { ApiClient } from "./client";

export interface RegisterRequest {
  email: string;
  givenname: string;
  mobile?: string;
  password: string;
  phone?: string;
  surname: string;
  username: string;
}

export function getRegisterStatus(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<boolean> {
  return apiClient.get<boolean>("/register", { signal });
}

export function registerUser(
  apiClient: ApiClient,
  request: RegisterRequest,
  signal?: AbortSignal
): Promise<boolean> {
  return apiClient.post<boolean>("/register", request, { signal });
}
