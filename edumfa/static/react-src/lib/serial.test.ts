import { describe, expect, it } from "vitest";

import { fixSerial, formatSerialSuggestion } from "./serial";

describe("fixSerial", () => {
  it("strips the type and description a suggestion carries", () => {
    expect(fixSerial("HOTP0001 (hotp) [desk token] ")).toBe("HOTP0001");
    expect(fixSerial("TOTP0002 (totp) ")).toBe("TOTP0002");
  });

  it("passes plain serials and empty input through", () => {
    expect(fixSerial("HOTP0001")).toBe("HOTP0001");
    expect(fixSerial("")).toBe("");
    expect(fixSerial(undefined)).toBe("");
  });
});

describe("formatSerialSuggestion", () => {
  const token = {
    description: "desk token",
    realms: ["realm1", "realm2"],
    serial: "HOTP0001",
    tokentype: "hotp",
    username: "alice"
  };

  it("formats like the legacy assign-token directive", () => {
    expect(formatSerialSuggestion(token)).toBe("HOTP0001 (hotp) [desk token] ");
  });

  it("includes the owner like the legacy attach-token directive", () => {
    expect(formatSerialSuggestion(token, { includeUser: true })).toBe(
      "HOTP0001 (hotp) [alice@realm1,realm2] [desk token] "
    );
  });

  it("round-trips through fixSerial", () => {
    expect(fixSerial(formatSerialSuggestion(token, { includeUser: true }))).toBe(
      "HOTP0001"
    );
  });
});
