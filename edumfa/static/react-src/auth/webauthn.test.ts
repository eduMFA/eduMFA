import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildWebAuthnCreationOptions,
  buildWebAuthnRequestOptions,
  registerWebAuthnCredential,
  signWebAuthnChallenge,
  WebAuthnUnavailableError,
  type WebAuthnRegisterRequest,
  type WebAuthnSignRequest
} from "./webauthn";
import { base64UrlToBytes } from "@/lib/base64url";

const request: WebAuthnRegisterRequest = {
  authenticatorSelectionList: ["aaguid-1"],
  displayName: "Alice Adams",
  excludeCredentials: [{ id: "AQID", transports: ["usb"], type: "public-key" }],
  name: "alice",
  nonce: "-_8",
  pubKeyCredAlgorithms: [{ alg: -7, type: "public-key" }],
  relyingParty: { id: "mfa.example.com", name: "eduMFA" },
  serialNumber: "WAN0001",
  transaction_id: "tx-1"
};

function installCredentials(create: ReturnType<typeof vi.fn>): void {
  vi.stubGlobal("PublicKeyCredential", {});
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: { create }
  });
}

describe("buildWebAuthnCreationOptions", () => {
  it("decodes the binary fields and maps the extensions", () => {
    const options = buildWebAuthnCreationOptions(request);

    expect(Array.from(options.challenge as Uint8Array)).toEqual([251, 255]);
    expect(new TextDecoder().decode(options.user.id as Uint8Array)).toBe("WAN0001");
    expect(options.user).toMatchObject({ displayName: "Alice Adams", name: "alice" });
    expect(options.attestation).toBe("direct");
    expect(options.timeout).toBe(60_000);
    expect(options.extensions).toEqual({ authnSel: ["aaguid-1"] });
    expect(
      options.excludeCredentials?.map((credential) =>
        Array.from(credential.id as Uint8Array)
      )
    ).toEqual([[1, 2, 3]]);
    expect(options.excludeCredentials?.[0]?.transports).toEqual(["usb"]);
    expect(options.authenticatorSelection).toBeUndefined();
  });
});

describe("registerWebAuthnCredential", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "credentials");
  });

  it("rejects when the browser has no WebAuthn", async () => {
    await expect(registerWebAuthnCredential(request)).rejects.toBeInstanceOf(
      WebAuthnUnavailableError
    );
  });

  it("encodes the attestation for the second /token/init step", async () => {
    const create = vi.fn().mockResolvedValue({
      getClientExtensionResults: () => ({ authnSel: true }),
      response: {
        attestationObject: new Uint8Array([1, 2, 3]).buffer,
        clientDataJSON: new Uint8Array([251, 255]).buffer
      },
      type: "public-key"
    });
    installCredentials(create);

    const response = await registerWebAuthnCredential(request);

    expect(response).toEqual({
      clientdata: "-_8",
      regdata: "AQID",
      registrationclientextensions: expect.any(String) as string,
      transaction_id: "tx-1",
      type: "webauthn"
    });
    expect(
      new TextDecoder().decode(
        base64UrlToBytes(response.registrationclientextensions ?? "")
      )
    ).toBe('{"authnSel":true}');
    expect(create).toHaveBeenCalledWith({
      publicKey: expect.objectContaining({ rp: request.relyingParty }) as object
    });
  });
});

const signRequest: WebAuthnSignRequest = {
  allowCredentials: [{ id: "AQID", transports: ["usb"], type: "public-key" }],
  challenge: "-_8",
  rpId: "mfa.example.com",
  timeout: 30_000,
  userVerification: "preferred"
};

describe("buildWebAuthnRequestOptions", () => {
  it("merges the allowed credentials of every sign request", () => {
    const options = buildWebAuthnRequestOptions([
      signRequest,
      { ...signRequest, allowCredentials: [{ id: "BAUG", type: "public-key" }] }
    ]);

    expect(Array.from(options.challenge as Uint8Array)).toEqual([251, 255]);
    expect(options.rpId).toBe("mfa.example.com");
    expect(options.timeout).toBe(30_000);
    expect(options.userVerification).toBe("preferred");
    expect(
      options.allowCredentials?.map((credential) =>
        Array.from(credential.id as Uint8Array)
      )
    ).toEqual([
      [1, 2, 3],
      [4, 5, 6]
    ]);
    expect(options.allowCredentials?.[0]?.transports).toEqual(["usb"]);
    expect(options.allowCredentials?.[1]?.transports).toBeUndefined();
  });

  it("refuses a challenge without sign requests", () => {
    expect(() => buildWebAuthnRequestOptions([])).toThrow();
  });
});

describe("signWebAuthnChallenge", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "credentials");
  });

  it("rejects when the browser has no WebAuthn", async () => {
    await expect(signWebAuthnChallenge([signRequest])).rejects.toBeInstanceOf(
      WebAuthnUnavailableError
    );
  });

  it("encodes the assertion for the /auth answer", async () => {
    const get = vi.fn().mockResolvedValue({
      getClientExtensionResults: () => ({}),
      id: "cred-1",
      response: {
        authenticatorData: new Uint8Array([4, 5, 6]).buffer,
        clientDataJSON: new Uint8Array([251, 255]).buffer,
        signature: new Uint8Array([1, 2, 3]).buffer,
        userHandle: new TextEncoder().encode("WAN0001").buffer
      },
      type: "public-key"
    });
    vi.stubGlobal("PublicKeyCredential", {});
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { get }
    });

    await expect(signWebAuthnChallenge([signRequest])).resolves.toEqual({
      authenticatordata: "BAUG",
      clientdata: "-_8",
      credentialid: "cred-1",
      signaturedata: "AQID",
      userhandle: "WAN0001"
    });
    expect(get).toHaveBeenCalledWith({
      publicKey: expect.objectContaining({ rpId: "mfa.example.com" }) as object
    });
  });
});
