import { describe, expect, it } from "vitest";

import {
  buildSessionFromLogin,
  derivePendingChallenge,
  getPendingPinChange,
  getStartRoute
} from "./loginFlow";
import type { AuthLoginResponse } from "@/api/auth";
import type { WebAuthnSignRequest } from "@/auth/webauthn";

const credentials = { realm: "realm1", username: "alice" };
const signRequest: WebAuthnSignRequest = {
  allowCredentials: [{ id: "AQID", type: "public-key" }],
  challenge: "-_8",
  rpId: "mfa.example.com"
};
const session: AuthLoginResponse = {
  menus: ["tokens"],
  realm: "realm1",
  rights: ["tokenlist"],
  role: "user",
  token: "jwt-1",
  token_page_size: 25,
  username: "alice"
};

describe("derivePendingChallenge", () => {
  it("returns null without a transaction", () => {
    expect(derivePendingChallenge(undefined, credentials)).toBeNull();
    expect(derivePendingChallenge({ message: "x" }, credentials)).toBeNull();
  });

  it("collects the answer modes of every challenged token", () => {
    expect(
      derivePendingChallenge(
        {
          message: "Please enter OTP:, Please confirm",
          multi_challenge: [
            {
              client_mode: "interactive",
              message: "Please enter OTP:",
              serial: "HOTP0001"
            },
            {
              attributes: { webAuthnSignRequest: signRequest },
              client_mode: "webauthn",
              serial: "WAN0001"
            },
            {
              client_mode: "poll",
              image: "data:image/png;base64,QUJD",
              serial: "PUSH0001"
            }
          ],
          transaction_id: "tx-1"
        },
        credentials
      )
    ).toEqual({
      image: "data:image/png;base64,QUJD",
      message: "Please enter OTP:, Please confirm",
      polling: true,
      realm: "realm1",
      serials: ["HOTP0001", "WAN0001", "PUSH0001"],
      showInput: true,
      transactionId: "tx-1",
      u2fSignRequests: [],
      username: "alice",
      webAuthnSignRequests: [signRequest]
    });
  });

  it("hides the input when no token is interactive", () => {
    expect(
      derivePendingChallenge(
        {
          multi_challenge: [{ client_mode: "poll", serial: "PUSH0001" }],
          transaction_id: "tx-2"
        },
        credentials
      )
    ).toMatchObject({ image: null, polling: true, showInput: false });
  });
});

describe("getPendingPinChange", () => {
  it("needs the pin_change flag and the serial", () => {
    expect(getPendingPinChange(undefined)).toBeNull();
    expect(getPendingPinChange({ pin_change: false, serial: "HOTP0001" })).toBeNull();
    expect(
      getPendingPinChange({
        next_pin_change: "2026-10-01",
        pin_change: true,
        serial: "HOTP0001"
      })
    ).toEqual({ nextPinChange: "2026-10-01", serial: "HOTP0001" });
  });
});

describe("getStartRoute", () => {
  it("follows the legacy controllers", () => {
    expect(getStartRoute(session, undefined)).toBe("/token/list");
    expect(getStartRoute({ ...session, admin_dashboard: true }, undefined)).toBe(
      "/dashboard"
    );
    expect(getStartRoute({ ...session, token_wizard: true }, undefined)).toBe(
      "/token/wizard"
    );
    expect(
      getStartRoute(
        { ...session, token_wizard: true },
        { pin_change: true, serial: "HOTP0001" }
      )
    ).toBe("/pinchange");
  });
});

describe("buildSessionFromLogin", () => {
  it("maps the login response to the React session", () => {
    const result = buildSessionFromLogin(session);

    expect(result).toMatchObject({
      authToken: "jwt-1",
      menus: ["tokens"],
      rights: ["tokenlist"],
      user: { realm: "realm1", role: "user", username: "alice" }
    });
    expect(result.settings.tokenPageSize).toBe(25);
  });
});
