import type { ApiClient } from "./client";
import type { EduMfaSuccessEnvelope } from "./envelope";

/**
 * Port of the AngularJS `ValidateFactory`. `POST /validate/check` answers
 * `result.value` plus a human readable `detail.message`, which the token
 * details view shows when the check fails.
 */

export interface ValidateCheckRequest {
  /** "1" checks the OTP value alone, without the PIN. */
  otponly?: string;
  pass: string;
  serial: string;
}

export interface ValidateCheckResult {
  message: string;
  success: boolean;
}

export async function checkToken(
  apiClient: ApiClient,
  request: ValidateCheckRequest
): Promise<ValidateCheckResult> {
  const envelope = await apiClient.post<EduMfaSuccessEnvelope<boolean>>(
    "/validate/check",
    request,
    { responseType: "envelope" }
  );
  const message = envelope.detail?.message;

  return {
    message: typeof message === "string" ? message : "",
    success: envelope.result.value
  };
}

/**
 * `GET /validate/polltransaction`: true once an out-of-band challenge of the
 * transaction (push, TiQR) was answered. The login page polls it like the
 * legacy `PollingAuthFactory`.
 */
export function pollTransaction(
  apiClient: ApiClient,
  transactionId: string,
  signal?: AbortSignal
): Promise<boolean> {
  return apiClient.get<boolean>("/validate/polltransaction", {
    params: { transaction_id: transactionId },
    signal
  });
}
