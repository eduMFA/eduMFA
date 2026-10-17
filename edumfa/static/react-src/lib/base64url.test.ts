import { describe, expect, it } from "vitest";

import { base64UrlToBytes, bytesToBase64Url, utf8ToBytes } from "./base64url";

describe("base64url", () => {
  it("decodes unpadded web-safe base64", () => {
    // "any carnal pleas" is the classic padding example: base64 "YW55IGNhcm5hbCBwbGVhcw=="
    expect(new TextDecoder().decode(base64UrlToBytes("YW55IGNhcm5hbCBwbGVhcw"))).toBe(
      "any carnal pleas"
    );
    expect(Array.from(base64UrlToBytes("-_8"))).toEqual([251, 255]);
  });

  it("encodes bytes without padding and with the web-safe alphabet", () => {
    expect(bytesToBase64Url(new Uint8Array([251, 255]))).toBe("-_8");
    expect(bytesToBase64Url(utf8ToBytes("any carnal pleas"))).toBe(
      "YW55IGNhcm5hbCBwbGVhcw"
    );
    expect(bytesToBase64Url(new Uint8Array([1, 2, 3]).buffer)).toBe("AQID");
  });

  it("round-trips arbitrary bytes", () => {
    const bytes = Uint8Array.from({ length: 64 }, (_, index) => (index * 37) % 256);

    expect(Array.from(base64UrlToBytes(bytesToBase64Url(bytes)))).toEqual(
      Array.from(bytes)
    );
  });
});
