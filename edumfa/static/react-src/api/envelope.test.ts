import { describe, expect, it } from "vitest";

import { ApiError, unwrapEduMfaEnvelope } from "./envelope";

describe("unwrapEduMfaEnvelope", () => {
  it("returns the value from a successful eduMFA envelope", () => {
    const value = unwrapEduMfaEnvelope({
      id: 1,
      jsonrpc: "2.0",
      result: {
        status: true,
        value: { ok: true }
      },
      version: "eduMFA"
    });

    expect(value).toEqual({ ok: true });
  });

  it("throws an ApiError for an eduMFA error envelope", () => {
    expect(() =>
      unwrapEduMfaEnvelope({
        id: 1,
        jsonrpc: "2.0",
        result: {
          error: {
            code: 403,
            message: "permission denied"
          },
          status: false
        },
        version: "eduMFA"
      })
    ).toThrow(ApiError);
  });

  it("throws an ApiError for an invalid envelope", () => {
    expect(() => unwrapEduMfaEnvelope(null)).toThrow(
      "The server returned an invalid eduMFA response."
    );
  });
});
