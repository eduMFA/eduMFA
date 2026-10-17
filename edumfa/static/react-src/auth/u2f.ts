export interface LegacyU2fApi {
  register: (
    appId: string,
    registerRequests: readonly unknown[],
    registeredKeys: readonly unknown[],
    callback: (response: unknown) => void,
    timeoutSeconds?: number
  ) => void;
  sign: (
    appId: string,
    challenge: string,
    registeredKeys: readonly unknown[],
    callback: (response: unknown) => void,
    timeoutSeconds?: number
  ) => void;
}

export function getLegacyU2fApi(win: Window = window): LegacyU2fApi | null {
  const candidate = (win as Window & { u2f?: unknown }).u2f;

  return isLegacyU2fApi(candidate) ? candidate : null;
}

function isLegacyU2fApi(candidate: unknown): candidate is LegacyU2fApi {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }

  const record = candidate as Record<string, unknown>;

  return typeof record.register === "function" && typeof record.sign === "function";
}

/** `detail.u2fRegisterRequest` of the first `POST /token/init` step. */
export interface U2fRegisterRequest {
  appId: string;
  challenge: string;
  version: string;
}

/** Parameters of the second `POST /token/init` step (plus `serial`). */
export interface U2fRegisterResponse {
  clientdata: string;
  regdata: string;
  type: "u2f";
}

/** `attributes.u2fSignRequest` of a login challenge. */
export interface U2fSignRequest {
  appId: string;
  challenge: string;
  keyHandle: string;
  version: string;
}

/** The signature, sent to `POST /auth` with the username and transaction id. */
export interface U2fSignResponse {
  clientdata: string;
  signaturedata: string;
}

/**
 * Error codes of the U2F JavaScript API (`u2f.ErrorCodes`). Index 0 is "OK"
 * and never raised; the pages translate the codes into messages.
 */
export type U2fErrorCode = 0 | 1 | 2 | 3 | 4 | 5;

export class U2fApiError extends Error {
  readonly errorCode: U2fErrorCode;

  constructor(errorCode: U2fErrorCode, message: string) {
    super(message);
    this.name = "U2fApiError";
    this.errorCode = errorCode;
  }
}

export class U2fUnavailableError extends Error {
  constructor() {
    super("The U2F API is not available in this browser.");
    this.name = "U2fUnavailableError";
  }
}

interface U2fApiResult {
  clientData?: string;
  errorCode?: number;
  errorMessage?: string;
  registrationData?: string;
  signatureData?: string;
}

/**
 * Port of the legacy `U2fFactory.register_request`: wraps the callback API
 * loaded by `contrib/js/u2f-api.js` in a promise and maps the result to the
 * parameters of the second enrollment step.
 */
export function registerU2fToken(
  request: U2fRegisterRequest,
  api: LegacyU2fApi | null = getLegacyU2fApi()
): Promise<U2fRegisterResponse> {
  if (!api) {
    return Promise.reject(new U2fUnavailableError());
  }

  return new Promise((resolve, reject) => {
    api.register(
      request.appId,
      [
        {
          attestation: "direct",
          challenge: request.challenge,
          version: request.version
        }
      ],
      [],
      (rawResult) => {
        const result = toApiResult(rawResult);

        if (result instanceof U2fApiError) {
          reject(result);

          return;
        }

        resolve({
          clientdata: result.clientData ?? "",
          regdata: result.registrationData ?? "",
          type: "u2f"
        });
      }
    );
  });
}

/**
 * Port of the legacy `U2fFactory.sign_request`: every key of the challenge
 * is offered to the device; app id and challenge come from the first
 * request, as the legacy controller assumed.
 */
export function signU2fChallenge(
  signRequests: readonly U2fSignRequest[],
  api: LegacyU2fApi | null = getLegacyU2fApi()
): Promise<U2fSignResponse> {
  const [firstRequest] = signRequests;

  if (!api) {
    return Promise.reject(new U2fUnavailableError());
  }

  if (!firstRequest) {
    return Promise.reject(new U2fApiError(2, "The challenge has no U2F sign request."));
  }

  return new Promise((resolve, reject) => {
    api.sign(
      firstRequest.appId,
      firstRequest.challenge,
      signRequests.map((request) => ({
        keyHandle: request.keyHandle,
        version: request.version
      })),
      (rawResult) => {
        const result = toApiResult(rawResult);

        if (result instanceof U2fApiError) {
          reject(result);

          return;
        }

        resolve({
          clientdata: result.clientData ?? "",
          signaturedata: result.signatureData ?? ""
        });
      }
    );
  });
}

function toApiResult(rawResult: unknown): U2fApiError | U2fApiResult {
  const result = (rawResult ?? {}) as U2fApiResult;
  const errorCode = result.errorCode ?? 0;

  if (errorCode > 0) {
    return new U2fApiError(toU2fErrorCode(errorCode), result.errorMessage ?? "");
  }

  return result;
}

function toU2fErrorCode(code: number): U2fErrorCode {
  return code >= 1 && code <= 5 ? (code as U2fErrorCode) : 1;
}
