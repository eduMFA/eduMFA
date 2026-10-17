import { describe, expect, it, vi } from "vitest";

import {
  registerU2fToken,
  signU2fChallenge,
  U2fApiError,
  U2fUnavailableError,
  type LegacyU2fApi,
  type U2fSignRequest
} from "./u2f";

const request = {
  appId: "https://mfa.example.com",
  challenge: "abc",
  version: "U2F_V2"
};

const signRequests: U2fSignRequest[] = [
  {
    appId: "https://mfa.example.com",
    challenge: "abc",
    keyHandle: "kh1",
    version: "U2F_V2"
  },
  {
    appId: "https://mfa.example.com",
    challenge: "abc",
    keyHandle: "kh2",
    version: "U2F_V2"
  }
];

function createApi(registerResult: unknown, signResult: unknown = {}): LegacyU2fApi {
  return {
    register: vi.fn(
      (_appId, _requests, _keys, callback: (response: unknown) => void) => {
        callback(registerResult);
      }
    ),
    sign: vi.fn((_appId, _challenge, _keys, callback: (response: unknown) => void) => {
      callback(signResult);
    })
  };
}

describe("registerU2fToken", () => {
  it("maps a successful registration to the second step parameters", async () => {
    const api = createApi({ clientData: "cd", registrationData: "rd" });

    await expect(registerU2fToken(request, api)).resolves.toEqual({
      clientdata: "cd",
      regdata: "rd",
      type: "u2f"
    });
    expect(api.register).toHaveBeenCalledWith(
      request.appId,
      [{ attestation: "direct", challenge: "abc", version: "U2F_V2" }],
      [],
      expect.any(Function)
    );
  });

  it("rejects with the U2F error code", async () => {
    const api = createApi({ errorCode: 5, errorMessage: "timed out" });
    const error = await registerU2fToken(request, api).catch(
      (reason: unknown) => reason
    );

    expect(error).toBeInstanceOf(U2fApiError);
    expect((error as U2fApiError).errorCode).toBe(5);
    expect((error as U2fApiError).message).toBe("timed out");
  });

  it("rejects when the legacy API is not loaded", async () => {
    await expect(registerU2fToken(request, null)).rejects.toBeInstanceOf(
      U2fUnavailableError
    );
  });
});

describe("signU2fChallenge", () => {
  it("offers every key of the challenge and maps the signature", async () => {
    const api = createApi({}, { clientData: "cd", signatureData: "sd" });

    await expect(signU2fChallenge(signRequests, api)).resolves.toEqual({
      clientdata: "cd",
      signaturedata: "sd"
    });
    expect(api.sign).toHaveBeenCalledWith(
      "https://mfa.example.com",
      "abc",
      [
        { keyHandle: "kh1", version: "U2F_V2" },
        { keyHandle: "kh2", version: "U2F_V2" }
      ],
      expect.any(Function)
    );
  });

  it("rejects with the U2F error code", async () => {
    const api = createApi({}, { errorCode: 4, errorMessage: "wrong device" });
    const error = await signU2fChallenge(signRequests, api).catch(
      (reason: unknown) => reason
    );

    expect(error).toBeInstanceOf(U2fApiError);
    expect((error as U2fApiError).errorCode).toBe(4);
  });

  it("rejects without sign requests or without the legacy API", async () => {
    await expect(signU2fChallenge([], createApi({}))).rejects.toBeInstanceOf(
      U2fApiError
    );
    await expect(signU2fChallenge(signRequests, null)).rejects.toBeInstanceOf(
      U2fUnavailableError
    );
  });
});
