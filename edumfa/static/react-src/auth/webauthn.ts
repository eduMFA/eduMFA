import { base64UrlToBytes, bytesToBase64Url, utf8ToBytes } from "@/lib/base64url";

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    Boolean(navigator.credentials)
  );
}

export function createWebAuthnCredential(
  publicKey: PublicKeyCredentialCreationOptions,
  signal?: AbortSignal
): Promise<Credential | null> {
  const options: CredentialCreationOptions = { publicKey };

  if (signal) {
    options.signal = signal;
  }

  return navigator.credentials.create(options);
}

export function getWebAuthnCredential(
  publicKey: PublicKeyCredentialRequestOptions,
  signal?: AbortSignal
): Promise<Credential | null> {
  const options: CredentialRequestOptions = { publicKey };

  if (signal) {
    options.signal = signal;
  }

  return navigator.credentials.get(options);
}

/**
 * `detail.webAuthnRegisterRequest` of the first `POST /token/init` step.
 * Binary fields are web-safe base64 strings.
 */
export interface WebAuthnRegisterRequest {
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  /** AAGUID allowlist, sent as the `authnSel` extension. */
  authenticatorSelectionList?: string[];
  displayName: string;
  excludeCredentials?: WebAuthnExcludedCredential[];
  message?: string;
  name: string;
  nonce: string;
  pubKeyCredAlgorithms: PublicKeyCredentialParameters[];
  relyingParty: PublicKeyCredentialRpEntity;
  serialNumber: string;
  timeout?: number;
  transaction_id: string;
}

export interface WebAuthnExcludedCredential {
  id: string;
  transports?: AuthenticatorTransport[];
  type: PublicKeyCredentialType;
}

/** Parameters of the second `POST /token/init` step (plus `serial`). */
export interface WebAuthnRegisterResponse {
  clientdata: string;
  regdata: string;
  registrationclientextensions?: string;
  transaction_id: string;
  type: "webauthn";
}

/** Port of `edumfa_webauthn.register`: request → `navigator.credentials.create` options. */
export function buildWebAuthnCreationOptions(
  request: WebAuthnRegisterRequest
): PublicKeyCredentialCreationOptions {
  const options: PublicKeyCredentialCreationOptions = {
    attestation: request.attestation ?? "direct",
    challenge: base64UrlToBytes(request.nonce),
    pubKeyCredParams: request.pubKeyCredAlgorithms,
    rp: request.relyingParty,
    timeout: request.timeout ?? 60_000,
    user: {
      displayName: request.displayName,
      id: utf8ToBytes(request.serialNumber),
      name: request.name
    }
  };

  if (request.authenticatorSelection) {
    options.authenticatorSelection = request.authenticatorSelection;
  }

  if (request.authenticatorSelectionList) {
    // `authnSel` is a registered extension the DOM typings do not know.
    options.extensions = {
      authnSel: request.authenticatorSelectionList
    } as AuthenticationExtensionsClientInputs;
  }

  if (request.excludeCredentials) {
    options.excludeCredentials = request.excludeCredentials.map((credential) => {
      const descriptor: PublicKeyCredentialDescriptor = {
        id: base64UrlToBytes(credential.id),
        type: credential.type
      };

      if (credential.transports) {
        descriptor.transports = credential.transports;
      }

      return descriptor;
    });
  }

  return options;
}

/**
 * Runs the WebAuthn registration ceremony for an enrollment and returns the
 * parameters of the second `/token/init` step. Rejects with the browser's
 * `DOMException` when the user cancels or no authenticator answers.
 */
export async function registerWebAuthnCredential(
  request: WebAuthnRegisterRequest,
  signal?: AbortSignal
): Promise<WebAuthnRegisterResponse> {
  if (!isWebAuthnAvailable()) {
    throw new WebAuthnUnavailableError();
  }

  const credential = await createWebAuthnCredential(
    buildWebAuthnCreationOptions(request),
    signal
  );

  if (!isPublicKeyCredential(credential)) {
    throw new WebAuthnUnavailableError();
  }

  const attestation = credential.response as AuthenticatorAttestationResponse;
  const response: WebAuthnRegisterResponse = {
    clientdata: bytesToBase64Url(attestation.clientDataJSON),
    regdata: bytesToBase64Url(attestation.attestationObject),
    transaction_id: request.transaction_id,
    type: "webauthn"
  };
  const extensionResults = credential.getClientExtensionResults();

  if (Object.keys(extensionResults).length > 0) {
    response.registrationclientextensions = bytesToBase64Url(
      utf8ToBytes(JSON.stringify(extensionResults))
    );
  }

  return response;
}

export class WebAuthnUnavailableError extends Error {
  constructor() {
    super("WebAuthn is not supported by this browser, or in this context.");
    this.name = "WebAuthnUnavailableError";
  }
}

function isPublicKeyCredential(
  credential: Credential | null
): credential is PublicKeyCredential {
  if (!credential) {
    return false;
  }

  const candidate = credential as Partial<PublicKeyCredential>;

  return (
    typeof candidate.getClientExtensionResults === "function" &&
    candidate.response !== undefined
  );
}

/**
 * `attributes.webAuthnSignRequest` of a login challenge. Binary fields are
 * web-safe base64 strings.
 */
export interface WebAuthnSignRequest {
  allowCredentials: WebAuthnAllowedCredential[];
  challenge: string;
  rpId: string;
  timeout?: number;
  userVerification?: UserVerificationRequirement;
}

export interface WebAuthnAllowedCredential {
  id: string;
  transports?: AuthenticatorTransport[];
  type: PublicKeyCredentialType;
}

/** Parameters of the `POST /auth` answer (plus username and transaction id). */
export interface WebAuthnSignResponse {
  authenticatordata: string;
  clientdata: string;
  credentialid: string;
  signaturedata: string;
  userhandle?: string;
}

/**
 * Port of `edumfa_webauthn.sign` including the legacy factory's merge: all
 * WebAuthn tokens of one login share a challenge, so their allowed
 * credentials are offered together while the other options come from the
 * first request.
 */
export function buildWebAuthnRequestOptions(
  signRequests: readonly WebAuthnSignRequest[]
): PublicKeyCredentialRequestOptions {
  const [firstRequest] = signRequests;

  if (!firstRequest) {
    throw new Error("The challenge has no WebAuthn sign request.");
  }

  const options: PublicKeyCredentialRequestOptions = {
    allowCredentials: signRequests.flatMap((request) =>
      request.allowCredentials.map((credential) => {
        const descriptor: PublicKeyCredentialDescriptor = {
          id: base64UrlToBytes(credential.id),
          type: credential.type
        };

        if (credential.transports) {
          descriptor.transports = credential.transports;
        }

        return descriptor;
      })
    ),
    challenge: base64UrlToBytes(firstRequest.challenge),
    rpId: firstRequest.rpId,
    timeout: firstRequest.timeout ?? 60_000
  };

  if (firstRequest.userVerification) {
    options.userVerification = firstRequest.userVerification;
  }

  return options;
}

/**
 * Runs the WebAuthn authentication ceremony for a login challenge and
 * returns the parameters of the `POST /auth` answer. Rejects with the
 * browser's `DOMException` when the user cancels or no authenticator
 * answers. Client extension results are not sent: the legacy client read a
 * property the browsers never set, so the backend never received them.
 */
export async function signWebAuthnChallenge(
  signRequests: readonly WebAuthnSignRequest[],
  signal?: AbortSignal
): Promise<WebAuthnSignResponse> {
  if (!isWebAuthnAvailable()) {
    throw new WebAuthnUnavailableError();
  }

  const credential = await getWebAuthnCredential(
    buildWebAuthnRequestOptions(signRequests),
    signal
  );

  if (!isPublicKeyCredential(credential)) {
    throw new WebAuthnUnavailableError();
  }

  const assertion = credential.response as AuthenticatorAssertionResponse;
  const response: WebAuthnSignResponse = {
    authenticatordata: bytesToBase64Url(assertion.authenticatorData),
    clientdata: bytesToBase64Url(assertion.clientDataJSON),
    credentialid: credential.id,
    signaturedata: bytesToBase64Url(assertion.signature)
  };

  if (assertion.userHandle) {
    response.userhandle = new TextDecoder().decode(assertion.userHandle);
  }

  return response;
}
