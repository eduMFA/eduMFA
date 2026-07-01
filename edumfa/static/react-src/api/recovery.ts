import type { ApiClient } from "./client";

export interface RecoveryCodeRequest {
  email: string;
  realm?: string;
  user: string;
}

export interface RecoveryResetRequest {
  password: string;
  realm?: string;
  recoverycode: string;
  user: string;
}

export function requestRecoveryCode(
  apiClient: ApiClient,
  request: RecoveryCodeRequest,
  signal?: AbortSignal
): Promise<boolean> {
  return apiClient.post<boolean>("/recover", request, { signal });
}

export function resetRecoveredPassword(
  apiClient: ApiClient,
  request: RecoveryResetRequest,
  signal?: AbortSignal
): Promise<boolean> {
  return apiClient.post<boolean>("/recover/reset", request, { signal });
}
