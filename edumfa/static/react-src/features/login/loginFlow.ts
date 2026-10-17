import type { AuthLoginDetail, AuthLoginResponse } from "@/api/auth";
import { normalizeWebUiSettings, type AuthSession } from "@/auth/AuthProvider";
import type { U2fSignRequest } from "@/auth/u2f";
import type { WebAuthnSignRequest } from "@/auth/webauthn";

/** A challenge-response login waiting for its second step. */
export interface PendingChallenge {
  /** Data URL of a QR code (TiQR, push); the last one when several tokens send one. */
  image: string | null;
  /** The challenge text (`detail.message`, the messages of all tokens joined). */
  message: string;
  /** At least one token is confirmed out of band (`client_mode: "poll"`). */
  polling: boolean;
  realm: string;
  /** Serials of the challenged tokens; the legacy view listed them when there was more than one. */
  serials: string[];
  /** At least one token expects a typed response (`client_mode: "interactive"`). */
  showInput: boolean;
  transactionId: string;
  u2fSignRequests: U2fSignRequest[];
  username: string;
  webAuthnSignRequests: WebAuthnSignRequest[];
}

/** `detail.pin_change` of a successful login: the token whose PIN expired. */
export interface PendingPinChange {
  nextPinChange: string | null;
  serial: string;
}

export interface LoginCredentials {
  realm: string;
  username: string;
}

/** Port of the challenge branch of the legacy `authenticate`. */
export function derivePendingChallenge(
  detail: AuthLoginDetail | undefined,
  credentials: LoginCredentials
): PendingChallenge | null {
  const transactionId = detail?.transaction_id;

  if (!detail || !transactionId) {
    return null;
  }

  const challenges = detail.multi_challenge ?? [];
  const images = challenges.flatMap((challenge) =>
    challenge.image ? [challenge.image] : []
  );

  return {
    image: images.at(-1) ?? null,
    message: detail.message ?? "",
    polling: challenges.some((challenge) => challenge.client_mode === "poll"),
    realm: credentials.realm,
    serials: challenges.flatMap((challenge) =>
      challenge.serial ? [challenge.serial] : []
    ),
    showInput: challenges.some((challenge) => challenge.client_mode === "interactive"),
    transactionId,
    u2fSignRequests: challenges.flatMap((challenge) =>
      challenge.attributes?.u2fSignRequest ? [challenge.attributes.u2fSignRequest] : []
    ),
    username: credentials.username,
    webAuthnSignRequests: challenges.flatMap((challenge) =>
      challenge.attributes?.webAuthnSignRequest
        ? [challenge.attributes.webAuthnSignRequest]
        : []
    )
  };
}

export function getPendingPinChange(
  detail: AuthLoginDetail | undefined
): PendingPinChange | null {
  if (!detail?.pin_change || !detail.serial) {
    return null;
  }

  return { nextPinChange: detail.next_pin_change ?? null, serial: detail.serial };
}

/**
 * Where the legacy controllers sent a fresh session: `do_login_stuff` chose
 * the dashboard or the token area, and `tokenController` moved on to the
 * wizard or the PIN change from there.
 */
export function getStartRoute(
  value: AuthLoginResponse,
  detail: AuthLoginDetail | undefined
): string {
  if (getPendingPinChange(detail)) {
    return "/pinchange";
  }

  if (value.token_wizard) {
    return "/token/wizard";
  }

  if (value.admin_dashboard) {
    return "/dashboard";
  }

  return "/token/list";
}

/** The React session when no Angular bridge takes the login over. */
export function buildSessionFromLogin(value: AuthLoginResponse): AuthSession {
  return {
    authToken: value.token ?? null,
    menus: value.menus ?? [],
    rights: value.rights ?? [],
    settings: normalizeWebUiSettings(value),
    user: { realm: value.realm, role: value.role, username: value.username }
  };
}
