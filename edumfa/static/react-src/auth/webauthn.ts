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
