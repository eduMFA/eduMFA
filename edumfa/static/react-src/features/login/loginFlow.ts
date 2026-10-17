import type { AuthLoginDetail, AuthLoginResponse } from "@/api/auth";
import {
  buildSession,
  type AuthSession,
  type PendingChallenge,
  type PendingPinChange
} from "@/auth/session";

export type { PendingChallenge, PendingPinChange };

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

/** The session of a successful login response. */
export function buildSessionFromLogin(
  value: AuthLoginResponse,
  versionNumber: string | null = null
): AuthSession {
  return buildSession(value, versionNumber);
}
