/**
 * Web-safe base64 as used by WebAuthn and the eduMFA backend: `-` and `_`
 * instead of `+` and `/`, no padding. Port of the helpers in
 * `contrib/js/webauthn-client/edumfa-webauthn.js`.
 */

export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";

  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function utf8ToBytes(value: string): Uint8Array<ArrayBuffer> {
  // Copying pins the buffer type; `encode` is typed with `ArrayBufferLike`.
  return new Uint8Array(new TextEncoder().encode(value));
}
