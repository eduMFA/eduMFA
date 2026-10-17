import type { ApiClient } from "./client";
import { configQueryKeys, type EduMfaServer, type EduMfaServers } from "./config";

/**
 * Port of the server definition calls of the AngularJS `ConfigFactory`:
 * SMTP servers, RADIUS servers, remote eduMFA servers and SMS gateways.
 * Paths and payload keys are unchanged; the list endpoints key the
 * definitions by identifier, SMS gateways come as a list with their id.
 */

/** One entry of `GET /smtpserver/`, keyed by identifier. */
export interface SmtpServer {
  description?: string | null;
  enqueue_job?: boolean | number | string | null;
  password?: string | null;
  port?: number | null;
  sender?: string | null;
  server: string;
  timeout?: number | null;
  tls?: boolean | number | string | null;
  username?: string | null;
  [key: string]: unknown;
}

export type SmtpServers = Record<string, SmtpServer>;

/**
 * Body of `POST /smtpserver/<identifier>`. Numbers left out fall back to
 * the backend defaults (port 25, timeout 10).
 */
export interface SmtpServerRequest {
  description: string;
  enqueue_job: boolean;
  identifier: string;
  password: string;
  port?: number;
  sender: string;
  server: string;
  timeout?: number;
  tls: boolean;
  username: string;
}

/** Body of `POST /smtpserver/send_test_email`. */
export interface SmtpTestEmailRequest extends SmtpServerRequest {
  recipient: string;
}

/** One entry of `GET /radiusserver/`, keyed by identifier; the secret is never delivered. */
export interface RadiusServer {
  description?: string | null;
  dictionary?: string | null;
  enforce_ma?: boolean | null;
  port?: number | null;
  retries?: number | null;
  server: string;
  timeout?: number | null;
  [key: string]: unknown;
}

export type RadiusServers = Record<string, RadiusServer>;

/**
 * Body of `POST /radiusserver/<identifier>`. Numbers and the dictionary
 * left out fall back to the backend defaults (1812, 5 s, 3 retries,
 * `/etc/edumfa/dictionary`).
 */
export interface RadiusServerRequest {
  description: string;
  dictionary?: string;
  enforce_ma: boolean;
  identifier: string;
  port?: number;
  retries?: number;
  secret: string;
  server: string;
  timeout?: number;
}

/** Body of `POST /radiusserver/test_request`. */
export interface RadiusTestRequest extends RadiusServerRequest {
  password: string;
  username: string;
}

export type { EduMfaServer, EduMfaServers };

/** Body of `POST /edumfaserver/<identifier>`. */
export interface EduMfaServerRequest {
  description: string;
  identifier: string;
  tls: boolean;
  url: string;
}

/** Body of `POST /edumfaserver/test_request`. */
export interface EduMfaServerTestRequest extends EduMfaServerRequest {
  password: string;
  username: string;
}

/** One entry of `GET /smsgateway/` (`SMSGateway.as_dict`). */
export interface SmsGateway {
  description: string | null;
  headers: Record<string, string>;
  id: number;
  name: string;
  options: Record<string, string>;
  providermodule: string;
  [key: string]: unknown;
}

/** One parameter of a provider module (`SMSProvider.parameters()`). */
export interface SmsProviderParameter {
  description?: string;
  required?: boolean;
  /** "text" asks for a multi-line input. */
  type?: string;
  /** Allowed values; rendered as a select. */
  values?: string[];
  [key: string]: unknown;
}

export interface SmsProvider {
  headers_allowed?: boolean;
  options_allowed?: boolean;
  parameters: Record<string, SmsProviderParameter>;
  [key: string]: unknown;
}

/** `GET /smsgateway/providers`, keyed by the provider module path. */
export type SmsProviders = Record<string, SmsProvider>;

/**
 * Body of `POST /smsgateway`: the gateway fields plus one `option.<name>`
 * key per parameter or option and one `header.<name>` key per header.
 */
export interface SmsGatewayRequest {
  description: string;
  /** Set when an existing definition is updated. */
  id?: number;
  module: string;
  name: string;
  [option: `option.${string}`]: string;
  [header: `header.${string}`]: string;
}

export const serverQueryKeys = {
  eduMfaServers: configQueryKeys.eduMfaServers,
  radiusServers: ["config", "radius-servers"] as const,
  smsGateways: ["config", "sms-gateways"] as const,
  smsProviders: ["config", "sms-providers"] as const,
  smtpServers: ["config", "smtp-servers"] as const,
  smsGateway: (gatewayId: string) => ["config", "sms-gateways", gatewayId] as const
};

export function getSmtpServers(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<SmtpServers> {
  return apiClient.get<SmtpServers>("/smtpserver/", { signal });
}

/** Creates or updates the definition; the identifier is part of the path like in the legacy factory. */
export function saveSmtpServer(
  apiClient: ApiClient,
  params: SmtpServerRequest
): Promise<boolean> {
  return apiClient.post<boolean>(
    `/smtpserver/${encodeURIComponent(params.identifier)}`,
    params
  );
}

export function deleteSmtpServer(
  apiClient: ApiClient,
  identifier: string
): Promise<boolean> {
  return apiClient.delete<boolean>(`/smtpserver/${encodeURIComponent(identifier)}`);
}

/** Sends a test email with the (possibly unsaved) form values; true when delivered. */
export function sendTestEmail(
  apiClient: ApiClient,
  params: SmtpTestEmailRequest
): Promise<boolean> {
  return apiClient.post<boolean>("/smtpserver/send_test_email", params);
}

export function getRadiusServers(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<RadiusServers> {
  return apiClient.get<RadiusServers>("/radiusserver/", { signal });
}

export function saveRadiusServer(
  apiClient: ApiClient,
  params: RadiusServerRequest
): Promise<boolean> {
  return apiClient.post<boolean>(
    `/radiusserver/${encodeURIComponent(params.identifier)}`,
    params
  );
}

export function deleteRadiusServer(
  apiClient: ApiClient,
  identifier: string
): Promise<boolean> {
  return apiClient.delete<boolean>(`/radiusserver/${encodeURIComponent(identifier)}`);
}

/** Authenticates the given user against the RADIUS server; true when accepted. */
export function testRadiusRequest(
  apiClient: ApiClient,
  params: RadiusTestRequest
): Promise<boolean> {
  return apiClient.post<boolean>("/radiusserver/test_request", params);
}

export { getEduMfaServers } from "./config";

export function saveEduMfaServer(
  apiClient: ApiClient,
  params: EduMfaServerRequest
): Promise<boolean> {
  return apiClient.post<boolean>(
    `/edumfaserver/${encodeURIComponent(params.identifier)}`,
    params
  );
}

export function deleteEduMfaServer(
  apiClient: ApiClient,
  identifier: string
): Promise<boolean> {
  return apiClient.delete<boolean>(`/edumfaserver/${encodeURIComponent(identifier)}`);
}

/** Authenticates the given user against the remote eduMFA server; true when accepted. */
export function testEduMfaServerRequest(
  apiClient: ApiClient,
  params: EduMfaServerTestRequest
): Promise<boolean> {
  return apiClient.post<boolean>("/edumfaserver/test_request", params);
}

export function getSmsGateways(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<SmsGateway[]> {
  return apiClient.get<SmsGateway[]>("/smsgateway/", { signal });
}

/** `GET /smsgateway/<id>` answers with a list holding the one definition. */
export function getSmsGateway(
  apiClient: ApiClient,
  gatewayId: string,
  signal?: AbortSignal
): Promise<SmsGateway[]> {
  return apiClient.get<SmsGateway[]>(`/smsgateway/${encodeURIComponent(gatewayId)}`, {
    signal
  });
}

export function getSmsProviders(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<SmsProviders> {
  return apiClient.get<SmsProviders>("/smsgateway/providers", { signal });
}

/** Creates or updates a gateway definition; returns its id. */
export function saveSmsGateway(
  apiClient: ApiClient,
  params: SmsGatewayRequest
): Promise<number> {
  return apiClient.post<number>("/smsgateway", params);
}

export function deleteSmsGateway(apiClient: ApiClient, name: string): Promise<number> {
  return apiClient.delete<number>(`/smsgateway/${encodeURIComponent(name)}`);
}
