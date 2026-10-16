import type { ApiClient } from "./client";

/**
 * Typed port of the AngularJS `TokenFactory`. Every function calls the same
 * Flask endpoint with the same parameters as the legacy factory. Request
 * cancellation (the legacy `getTokens` canceller) is handled by passing the
 * React Query `signal` instead.
 */

export interface TokenListParams {
  active?: boolean | string;
  assigned?: boolean | string;
  description?: string;
  infokey?: string;
  infovalue?: string;
  page?: number;
  pagesize?: number;
  resolver?: string;
  rollout_state?: string;
  serial?: string;
  sortby?: string;
  sortdir?: "asc" | "desc";
  tokenrealm?: string;
  type?: string;
  user?: string;
  userid?: string;
}

export interface TokenDetail {
  active: boolean;
  count: number;
  count_window: number;
  description: string;
  failcount: number;
  id: number;
  info: Record<string, string>;
  locked: boolean;
  maxfail: number;
  otplen: number;
  realms: string[];
  revoked: boolean;
  rollout_state: string;
  serial: string;
  sync_window: number;
  tokentype: string;
  user_editable?: boolean;
  user_id?: string;
  user_realm: string;
  username: string;
  [key: string]: unknown;
}

export interface TokenListResponse {
  count: number;
  current: number;
  next: number | null;
  prev: number | null;
  tokens: TokenDetail[];
}

export interface TokenAssignRequest {
  pin?: string;
  realm?: string;
  serial: string;
  user?: string;
}

export interface TokenEnrollRequest {
  genkey?: number;
  otpkey?: string | null;
  pin?: string;
  realm?: string;
  serial?: string;
  type?: string;
  user?: string;
  [key: string]: unknown;
}

export interface TokenChallenge {
  challenge: string;
  expiration: string;
  id: number;
  otp_received: boolean;
  received_count: number;
  serial: string;
  timestamp: string;
  transaction_id: string;
  [key: string]: unknown;
}

export interface TokenChallengeListResponse {
  challenges: TokenChallenge[];
  count: number;
  current: number;
  next: number | null;
  prev: number | null;
}

export const tokenQueryKeys = {
  all: ["tokens"] as const,
  challenges: (serial: string, params?: Record<string, unknown>) =>
    ["tokens", "challenges", serial, params ?? {}] as const,
  detail: (serial: string) => ["tokens", "detail", serial] as const,
  list: (params?: TokenListParams) => ["tokens", "list", params ?? {}] as const
};

export function getTokens(
  apiClient: ApiClient,
  params?: TokenListParams,
  signal?: AbortSignal
): Promise<TokenListResponse> {
  return apiClient.get<TokenListResponse>("/token/", {
    params: { ...params },
    signal
  });
}

export function getTokenBySerial(
  apiClient: ApiClient,
  serial: string,
  signal?: AbortSignal
): Promise<TokenListResponse> {
  return apiClient.get<TokenListResponse>("/token/", { params: { serial }, signal });
}

export function enableToken(apiClient: ApiClient, serial: string): Promise<number> {
  return apiClient.post<number>("/token/enable", { serial });
}

export function disableToken(apiClient: ApiClient, serial: string): Promise<number> {
  return apiClient.post<number>("/token/disable", { serial });
}

export function revokeToken(apiClient: ApiClient, serial: string): Promise<number> {
  return apiClient.post<number>("/token/revoke", { serial });
}

export function unassignToken(apiClient: ApiClient, serial: string): Promise<number> {
  return apiClient.post<number>("/token/unassign", { serial });
}

export function resetFailCounter(
  apiClient: ApiClient,
  serial: string
): Promise<number> {
  return apiClient.post<number>("/token/reset", { serial });
}

export function deleteToken(apiClient: ApiClient, serial: string): Promise<number> {
  return apiClient.delete<number>(`/token/${encodeURIComponent(serial)}`);
}

export function markTokenLost(
  apiClient: ApiClient,
  serial: string
): Promise<Record<string, unknown>> {
  return apiClient.post<Record<string, unknown>>(
    `/token/lost/${encodeURIComponent(serial)}`,
    {}
  );
}

export function assignToken(
  apiClient: ApiClient,
  request: TokenAssignRequest
): Promise<boolean> {
  return apiClient.post<boolean>("/token/assign", request);
}

export function resyncToken(
  apiClient: ApiClient,
  request: { otp1: string; otp2: string; serial: string }
): Promise<boolean> {
  return apiClient.post<boolean>("/token/resync", request);
}

export function setTokenPin(
  apiClient: ApiClient,
  serial: string,
  key: "otppin" | "sopin" | "userpin",
  value: string
): Promise<number> {
  return apiClient.post<number>(`/token/setpin/${encodeURIComponent(serial)}`, {
    [key]: value
  });
}

export function setRandomPin(apiClient: ApiClient, serial: string): Promise<string> {
  return apiClient.post<string>(
    `/token/setrandompin/${encodeURIComponent(serial)}`,
    {}
  );
}

export function setTokenProperties(
  apiClient: ApiClient,
  serial: string,
  properties: Record<string, boolean | number | string>
): Promise<number> {
  return apiClient.post<number>(`/token/set/${encodeURIComponent(serial)}`, properties);
}

export function setTokenDescription(
  apiClient: ApiClient,
  serial: string,
  description: string
): Promise<number> {
  return apiClient.post<number>(`/token/description/${encodeURIComponent(serial)}`, {
    description
  });
}

export function setTokenRealms(
  apiClient: ApiClient,
  serial: string,
  realms: string[]
): Promise<boolean> {
  return apiClient.post<boolean>(`/token/realm/${encodeURIComponent(serial)}`, {
    realms
  });
}

export function setTokenGroups(
  apiClient: ApiClient,
  serial: string,
  groups: string[]
): Promise<boolean> {
  return apiClient.post<boolean>(`/token/group/${encodeURIComponent(serial)}`, {
    groups
  });
}

export function enrollToken(
  apiClient: ApiClient,
  request: TokenEnrollRequest
): Promise<Record<string, unknown>> {
  return apiClient.post<Record<string, unknown>>("/token/init", request);
}

export function getSerialByOtp(
  apiClient: ApiClient,
  otp: string,
  params?: Record<string, boolean | number | string>,
  signal?: AbortSignal
): Promise<{ count: number; serial: string | null }> {
  return apiClient.get<{ count: number; serial: string | null }>(
    `/token/getserial/${encodeURIComponent(otp)}`,
    { params: { ...params }, signal }
  );
}

export function getTokenChallenges(
  apiClient: ApiClient,
  serial: string,
  params?: { page?: number; pagesize?: number; sortby?: string; sortdir?: string },
  signal?: AbortSignal
): Promise<TokenChallengeListResponse> {
  return apiClient.get<TokenChallengeListResponse>(
    `/token/challenges/${encodeURIComponent(serial)}`,
    { params: { ...params }, signal }
  );
}
