import type { ApiClient } from "./client";
import type { EduMfaSuccessEnvelope } from "./envelope";
import type { U2fSignRequest } from "@/auth/u2f";
import type { WebAuthnSignRequest } from "@/auth/webauthn";
import type { LegacyWebUiSettings } from "@/global";

/**
 * `POST /auth` parameters. The first step sends the credentials; a
 * challenge-response answer repeats the username with the `transaction_id`,
 * and FIDO answers carry the signature fields instead of a password.
 */
export interface AuthLoginRequest {
  authenticatordata?: string;
  clientdata?: string;
  credentialid?: string;
  password?: string;
  realm?: string;
  signaturedata?: string;
  transaction_id?: string;
  userhandle?: string;
  username: string;
}

/**
 * `result.value` of a login. Next to the session it carries the WebUI policy
 * values (`get_webui_settings` in `api/lib/postpolicy.py`); a pending
 * challenge only answers the role, username and realm.
 */
export interface AuthLoginResponse extends LegacyWebUiSettings {
  admin_dashboard?: boolean;
  deletion_confirmation?: boolean;
  dialog_no_token?: boolean;
  hide_welcome?: boolean;
  log_level?: number;
  logout_redirect_url?: string;
  logout_time?: number;
  menus?: string[];
  realm: string;
  rights?: string[];
  role: string;
  timeout_action?: string;
  token?: string;
  username: string;
}

/** One entry of `detail.multi_challenge` (`create_challenges_from_tokens` in `lib/token.py`). */
export interface AuthChallenge {
  attributes?: AuthChallengeAttributes;
  /** How the client answers: "interactive", "poll", "u2f" or "webauthn". */
  client_mode?: string;
  /** Data URL of a QR code (TiQR, push). */
  image?: string;
  message?: string;
  serial?: string;
  transaction_id?: string;
  type?: string;
}

export interface AuthChallengeAttributes {
  u2fSignRequest?: U2fSignRequest;
  webAuthnSignRequest?: WebAuthnSignRequest;
}

/** `detail` of a login response: the challenge data, or the PIN change notice after success. */
export interface AuthLoginDetail {
  message?: string;
  messages?: string[];
  multi_challenge?: AuthChallenge[];
  next_pin_change?: string;
  pin_change?: boolean;
  serial?: string;
  transaction_id?: string;
}

export interface AuthLoginEnvelope extends Omit<
  EduMfaSuccessEnvelope<AuthLoginResponse>,
  "detail"
> {
  detail?: AuthLoginDetail;
}

/** `GET /auth/rights`: the token types the session may enroll, with their descriptions. */
export type AuthRightsResponse = Record<string, string>;

export const authQueryKeys = {
  rights: ["auth", "rights"] as const
};

/**
 * `POST /auth`. The whole envelope is returned: a pending challenge lives in
 * `detail`, and the legacy controller reads `versionnumber` from it when the
 * session is handed over.
 */
export function authenticate(
  apiClient: ApiClient,
  request: AuthLoginRequest,
  signal?: AbortSignal
): Promise<AuthLoginEnvelope> {
  return apiClient.post<AuthLoginEnvelope>("/auth", request, {
    responseType: "envelope",
    signal
  });
}

export function getAuthRights(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<AuthRightsResponse> {
  return apiClient.get<AuthRightsResponse>("/auth/rights", { signal });
}
