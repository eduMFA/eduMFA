import type { ApiClient } from "./client";
import type { EduMfaSuccessEnvelope } from "./envelope";

/**
 * Port of the system part of the AngularJS `ConfigFactory`: the config
 * entries under `/system/` and the small lookups the system and token config
 * forms need (SMTP servers, SMS gateways, RADIUS servers). Realms, resolvers
 * and the read-only system calls live in `api/config.ts`.
 */

/** A value for `POST /system/setConfig`; the backend stores it as text. */
export type SystemConfigValue = boolean | number | string;

/** Config keys with their new values, e.g. `{ splitAtSign: true, "PrependPin.type": "public" }`. */
export type SystemConfigRequest = Record<string, SystemConfigValue>;

/** `POST /system/setConfig` answers "insert" or "update" per stored key. */
export type SystemConfigSaveResult = Record<string, string>;

/** One entry of `GET /smtpserver/`, keyed by identifier. */
export interface SmtpServerConfig {
  description?: string;
  identifier: string;
  port?: number;
  sender?: string;
  server?: string;
  tls?: boolean;
  [key: string]: unknown;
}

export type SmtpServers = Record<string, SmtpServerConfig>;

/** One entry of `GET /smsgateway/`. */
export interface SmsGateway {
  description?: string;
  id: number;
  name: string;
  option_dict?: Record<string, unknown>;
  providermodule: string;
  [key: string]: unknown;
}

/** One entry of `GET /radiusserver/`, keyed by identifier. */
export interface RadiusServerConfig {
  description?: string;
  dictionary?: string;
  identifier: string;
  port?: number;
  server?: string;
  [key: string]: unknown;
}

export type RadiusServers = Record<string, RadiusServerConfig>;

export type RandomEncoding = "b64" | "hex";

export const systemQueryKeys = {
  all: ["system"] as const,
  documentation: ["system", "documentation"] as const,
  radiusServers: ["system", "radius-servers"] as const,
  smsGateways: ["system", "sms-gateways"] as const,
  smtpServers: ["system", "smtp-servers"] as const
};

/**
 * `POST /system/setConfig`. A `<key>.type` entry of "password" stores
 * `<key>` encrypted; the `.type` and `.desc` entries themselves are not kept.
 */
export function saveSystemConfig(
  apiClient: ApiClient,
  params: SystemConfigRequest
): Promise<SystemConfigSaveResult> {
  return apiClient.post<SystemConfigSaveResult>("/system/setConfig", params);
}

/** `DELETE /system/<key>`. */
export function deleteSystemConfig(
  apiClient: ApiClient,
  key: string
): Promise<boolean | number> {
  return apiClient.delete<boolean | number>(`/system/${encodeURIComponent(key)}`);
}

/**
 * `GET /system/documentation`: the configuration as a reStructuredText
 * document. The endpoint answers plain text instead of the JSON envelope.
 */
export function getSystemDocumentation(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string> {
  return apiClient.get<string>("/system/documentation", {
    responseType: "text",
    signal
  });
}

/** `GET /system/random?len=<bytes>&encode=<hex|b64>`: key material from the server. */
export function getRandom(
  apiClient: ApiClient,
  length: number,
  encode: RandomEncoding,
  signal?: AbortSignal
): Promise<string> {
  return apiClient.get<string>("/system/random", {
    params: { encode, len: length },
    signal
  });
}

/**
 * `POST /system/test/<tokentype>`: lets a token class test its settings.
 * The result message travels in `detail`, so the whole envelope is returned.
 */
export function testTokenConfig(
  apiClient: ApiClient,
  tokentype: string,
  params: SystemConfigRequest
): Promise<EduMfaSuccessEnvelope<boolean>> {
  return apiClient.post<EduMfaSuccessEnvelope<boolean>>(
    `/system/test/${encodeURIComponent(tokentype)}`,
    params,
    { responseType: "envelope" }
  );
}

/** Requires the `smtpserver_read` right. */
export function getSmtpServers(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<SmtpServers> {
  return apiClient.get<SmtpServers>("/smtpserver/", { signal });
}

/** Requires the `smsgateway_read` right. */
export function getSmsGateways(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<SmsGateway[]> {
  return apiClient.get<SmsGateway[]>("/smsgateway/", { signal });
}

/** Requires the `radiusserver_read` right. */
export function getRadiusServers(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<RadiusServers> {
  return apiClient.get<RadiusServers>("/radiusserver/", { signal });
}
