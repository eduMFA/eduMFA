import type { ApiClient } from "./client";
import type { EduMfaSuccessEnvelope } from "./envelope";
import type { U2fRegisterRequest } from "@/auth/u2f";
import type { WebAuthnRegisterRequest } from "@/auth/webauthn";

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
  /** Token info; `tokenkind` is "hardware" or "software", `certificate` and `pkcs12` are blobs. */
  info: Record<string, string>;
  locked: boolean;
  maxfail: number;
  otplen: number;
  realms: string[];
  /** Resolver of the assigned user; only sent for assigned tokens. */
  resolver?: string;
  revoked: boolean;
  rollout_state: string;
  serial: string;
  sync_window: number;
  /** Only present when token groups are configured. */
  tokengroup?: string[];
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
  genkey?: boolean | number;
  otpkey?: string | null;
  pin?: string;
  realm?: string;
  serial?: string;
  type?: string;
  user?: string;
  [key: string]: unknown;
}

/** A link the backend also renders as QR code (`googleurl`, `pushurl`, ...). */
export interface TokenEnrollLink {
  description?: string;
  /** Data URL of the QR code image. */
  img?: string;
  value?: string;
}

/**
 * `detail` section of a `POST /token/init` response. Which keys are present
 * depends on the token type and on the enrollment step.
 */
export interface TokenEnrollDetail {
  /** PEM certificate (certificate token). */
  certificate?: string;
  googleurl?: TokenEnrollLink;
  motpurl?: TokenEnrollLink;
  otpkey?: TokenEnrollLink & { value_b32?: string };
  /** OTP values of paper and TAN tokens, keyed by position. */
  otps?: Record<string, string>;
  /** Static password of an application specific password token. */
  password?: string;
  /** Base64 PKCS#12 container when the key pair was generated on the server. */
  pkcs12?: string;
  pushurl?: TokenEnrollLink;
  registrationcode?: string;
  rollout_state?: string;
  serial: string;
  tiqrenroll?: TokenEnrollLink;
  u2fRegisterRequest?: U2fRegisterRequest;
  u2fRegisterResponse?: { subject?: string };
  verify?: { message?: string };
  webAuthnRegisterRequest?: WebAuthnRegisterRequest;
  webAuthnRegisterResponse?: { subject?: string };
  [key: string]: unknown;
}

export interface TokenEnrollResult {
  detail: TokenEnrollDetail;
  value: boolean;
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

/** `POST /token/lost/<serial>` result. */
export interface TokenLostResult {
  disable?: boolean;
  end_date: string;
  init: boolean;
  password: string;
  pin?: boolean;
  serial: string;
  user?: boolean;
  valid_to?: string;
}

export type TokenImportFileType = "OATH CSV" | "Yubikey CSV" | "aladdin-xml" | "pskc";

export type PskcValidateMac = "check_fail_hard" | "check_fail_soft" | "no_check";

export interface TokenImportOptions {
  fileType: TokenImportFileType;
  /** PSKC password; mutually exclusive with `psk`. */
  password?: string;
  /** PSKC pre-shared key as 32 hex characters; mutually exclusive with `password`. */
  psk?: string;
  pskcValidateMac?: PskcValidateMac;
  /** Realm the imported tokens are put into. */
  realm?: string;
}

export interface TokenImportResult {
  n_imported: number;
  n_not_imported: number;
}

export interface TokenChallengeListParams {
  page?: number;
  pagesize?: number;
  sortby?: string;
  sortdir?: "asc" | "desc";
}

/** `GET /token/getserial/<otp>` response. `serial` is `null` when nothing matched. */
export interface TokenSerialLookupResponse {
  count: number;
  serial: string | null;
}

export const tokenQueryKeys = {
  all: ["tokens"] as const,
  challenges: (serial: string | null, params?: TokenChallengeListParams) =>
    ["tokens", "challenges", serial ?? "", params ?? {}] as const,
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
): Promise<TokenLostResult> {
  return apiClient.post<TokenLostResult>(
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

/**
 * `POST /token/setrandompin/<serial>`. The generated PIN travels in the
 * `detail` section, so the whole envelope is read.
 */
export async function setRandomPin(
  apiClient: ApiClient,
  serial: string
): Promise<{ pin: string; value: number }> {
  const envelope = await apiClient.post<EduMfaSuccessEnvelope<number>>(
    `/token/setrandompin/${encodeURIComponent(serial)}`,
    {},
    { responseType: "envelope" }
  );
  const pin = envelope.detail?.pin;

  return { pin: typeof pin === "string" ? pin : "", value: envelope.result.value };
}

/**
 * Answers the verification challenge of a token in rollout state "verify",
 * through `POST /token/init` like the legacy `sendVerifyResponse`.
 */
export function verifyTokenEnrollment(
  apiClient: ApiClient,
  request: { serial: string; type: string; verify: string }
): Promise<boolean> {
  return apiClient.post<boolean>("/token/init", request);
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

/**
 * `POST /token/init`. The enrollment data (QR codes, OTP lists, FIDO
 * registration requests) travels in the `detail` section, so the whole
 * envelope is read.
 */
export async function enrollToken(
  apiClient: ApiClient,
  request: TokenEnrollRequest
): Promise<TokenEnrollResult> {
  const envelope = await apiClient.post<EduMfaSuccessEnvelope<boolean>>(
    "/token/init",
    request,
    { responseType: "envelope" }
  );
  const detail = envelope.detail ?? {};
  const serial = typeof detail.serial === "string" ? detail.serial : request.serial;

  return {
    detail: { ...detail, serial: serial ?? "" },
    value: envelope.result.value
  };
}

export function getSerialByOtp(
  apiClient: ApiClient,
  otp: string,
  params?: Record<string, boolean | number | string>,
  signal?: AbortSignal
): Promise<TokenSerialLookupResponse> {
  return apiClient.get<TokenSerialLookupResponse>(
    `/token/getserial/${encodeURIComponent(otp)}`,
    { params: { ...params }, signal }
  );
}

/**
 * `GET /token/challenges/<serial>`. The serial may carry `*` wildcards like
 * the legacy filter did; `null` lists the challenges of every token.
 */
export function getTokenChallenges(
  apiClient: ApiClient,
  serial: string | null,
  params?: TokenChallengeListParams,
  signal?: AbortSignal
): Promise<TokenChallengeListResponse> {
  const path = serial
    ? `/token/challenges/${encodeURIComponent(serial)}`
    : "/token/challenges/";

  return apiClient.get<TokenChallengeListResponse>(path, {
    params: { ...params },
    signal
  });
}

/**
 * `POST /token/load/<filename>` as a multipart upload, like the legacy
 * ng-file-upload call. Only the options that are set are sent.
 */
export function importTokens(
  apiClient: ApiClient,
  file: File,
  options: TokenImportOptions
): Promise<TokenImportResult> {
  const formData = new FormData();

  formData.append("file", file, file.name);
  formData.append("type", options.fileType);
  formData.append("tokenrealms", options.realm ?? "");

  if (options.psk) {
    formData.append("psk", options.psk);
  }

  if (options.password) {
    formData.append("password", options.password);
  }

  if (options.pskcValidateMac) {
    formData.append("pskcValidateMAC", options.pskcValidateMac);
  }

  return apiClient.post<TokenImportResult>(
    `/token/load/${encodeURIComponent(file.name)}`,
    undefined,
    { formData }
  );
}
