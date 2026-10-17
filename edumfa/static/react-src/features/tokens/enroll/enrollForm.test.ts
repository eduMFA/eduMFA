import { describe, expect, it } from "vitest";

import {
  buildEnrollRequest,
  getSshKeyComment,
  getVascoSerial,
  initialEnrollForm,
  resolveEnrollForm,
  validateEnrollForm,
  type EnrollFormContext,
  type EnrollFormState,
  type EnrollSession
} from "./enrollForm";

const context: EnrollFormContext = {
  caConnectors: ["localCA"],
  defaultRealm: "realm1",
  defaultTokenType: "hotp",
  indexedSecretPreset: "",
  rights: ["enrollHOTP", "enrollTOTP", "totp_2step=force"],
  systemConfig: {
    "hotp.hashlib": "sha256",
    "radius.identifier": "myradius",
    "totp.timeStep": "60"
  },
  userEmail: "alice@example.com",
  userPhones: ["+491234"]
};

const adminSession: EnrollSession = { realm: "", role: "admin", username: "admin" };
const userSession: EnrollSession = {
  realm: "realm2",
  role: "user",
  username: "cornelius"
};

function form(patch: Partial<EnrollFormState> = {}): EnrollFormState {
  return { ...initialEnrollForm, ...patch };
}

describe("resolveEnrollForm", () => {
  it("derives the type defaults like the legacy changeTokenType", () => {
    const hotp = resolveEnrollForm(form(), context);
    expect(hotp).toMatchObject({
      ca: "localCA",
      email: "alice@example.com",
      genkey: true,
      hashlib: "sha256",
      otplen: 6,
      phone: "+491234",
      radiusIdentifier: "myradius",
      realm: "realm1",
      timeStep: "30",
      twoStepInit: false,
      type: "hotp"
    });

    expect(resolveEnrollForm(form({ type: "totp" }), context)).toMatchObject({
      hashlib: "sha256",
      timeStep: "60",
      twoStepInit: true
    });
    expect(resolveEnrollForm(form({ type: "yubikey" }), context)).toMatchObject({
      genkey: false,
      otplen: 44
    });
    expect(resolveEnrollForm(form({ type: "daypassword" }), context)).toMatchObject({
      timeStep: "60"
    });
    expect(
      resolveEnrollForm(form({ type: "indexedsecret" }), {
        ...context,
        indexedSecretPreset: "secret phrase"
      })
    ).toMatchObject({ genkey: false, otpkey: "secret phrase" });
  });

  it("keeps values the user typed", () => {
    expect(
      resolveEnrollForm(
        form({ email: "", genkey: false, hashlib: "sha512", otplen: 8, phone: "1" }),
        context
      )
    ).toMatchObject({
      email: "",
      genkey: false,
      hashlib: "sha512",
      otplen: 8,
      phone: "1"
    });
  });
});

describe("buildEnrollRequest", () => {
  it("sends the common OTP settings and the admin's picked user", () => {
    const request = buildEnrollRequest(
      resolveEnrollForm(
        form({ description: "Phone", pin: "1234", user: "[1002] alice (Alice Adams)" }),
        context
      ),
      { mode: "enroll", session: adminSession }
    );

    expect(request).toEqual({
      "2stepinit": false,
      description: "Phone",
      genkey: true,
      hashlib: "sha256",
      otplen: 6,
      pin: "1234",
      realm: "realm1",
      timeStep: 30,
      type: "hotp",
      useTimeShift: "default",
      user: "alice"
    });
  });

  it("enrolls for the logged-in user and only sends a typed key without genkey", () => {
    const generated = buildEnrollRequest(
      resolveEnrollForm(form({ otpkey: "3132" }), context),
      { mode: "enroll", session: userSession }
    );
    expect(generated).toMatchObject({
      genkey: true,
      realm: "realm2",
      user: "cornelius"
    });
    expect(generated).not.toHaveProperty("otpkey");
    expect(generated).not.toHaveProperty("pin");

    const typed = buildEnrollRequest(
      resolveEnrollForm(form({ genkey: false, otpkey: "3132" }), context),
      { mode: "enroll", session: userSession }
    );
    expect(typed).toMatchObject({ genkey: false, otpkey: "3132" });
  });

  it("marks a rollover and formats the validity period", () => {
    const request = buildEnrollRequest(
      resolveEnrollForm(
        form({
          type: "totp",
          validityEnd: new Date(2030, 0, 2, 8, 30),
          validityStart: new Date(2030, 0, 1, 8, 30)
        }),
        context
      ),
      { mode: "rollover", rolloverSerial: "TOTP0001", session: userSession }
    );

    expect(request).toMatchObject({
      rollover: true,
      serial: "TOTP0001",
      timeStep: 60,
      type: "totp"
    });
    expect(request.validity_period_start).toMatch(/^2030-01-01T08:30[+-]\d{4}$/);
    expect(request.validity_period_end).toMatch(/^2030-01-02T08:30[+-]\d{4}$/);
  });

  it("adds the type-specific keys", () => {
    const sms = buildEnrollRequest(
      resolveEnrollForm(form({ smsIdentifier: "gw1", type: "sms" }), context),
      { mode: "enroll", session: userSession }
    );
    expect(sms).toMatchObject({
      dynamic_phone: false,
      phone: "+491234",
      "sms.identifier": "gw1"
    });

    const dynamicSms = buildEnrollRequest(
      resolveEnrollForm(form({ dynamicPhone: true, type: "sms" }), context),
      { mode: "enroll", session: userSession }
    );
    expect(dynamicSms).toMatchObject({ dynamic_phone: true });
    expect(dynamicSms).not.toHaveProperty("phone");

    expect(
      buildEnrollRequest(
        resolveEnrollForm(
          form({
            certificateMode: "csrupload",
            certificateRequest: "CSR",
            type: "certificate"
          }),
          context
        ),
        { mode: "enroll", session: adminSession }
      )
    ).toMatchObject({ ca: "localCA", request: "CSR", template: "" });

    expect(
      buildEnrollRequest(
        resolveEnrollForm(
          form({
            fourEyes: {
              realm1: { count: 2, selected: true },
              realm2: { count: 1, selected: false }
            },
            separator: "|",
            type: "4eyes"
          }),
          context
        ),
        { mode: "enroll", session: adminSession }
      )
    ).toMatchObject({ "4eyes": "realm1:2", separator: "|" });

    expect(
      buildEnrollRequest(
        resolveEnrollForm(
          form({ radiusLocalCheckPin: true, radiusUser: "bob", type: "radius" }),
          context
        ),
        { mode: "enroll", session: adminSession }
      )
    ).toMatchObject({
      "radius.identifier": "myradius",
      "radius.local_checkpin": true,
      "radius.system_settings": true,
      "radius.user": "bob"
    });

    expect(
      buildEnrollRequest(
        resolveEnrollForm(form({ timeStep: "1d", type: "daypassword" }), context),
        { mode: "enroll", session: userSession }
      )
    ).toMatchObject({ timeStep: "1d" });

    expect(
      buildEnrollRequest(
        resolveEnrollForm(
          form({ questions: { "Pet?": "Cat", "Town?": "" }, type: "question" }),
          context
        ),
        { mode: "enroll", session: userSession }
      )
    ).toMatchObject({ questions: { "Pet?": "Cat" } });
  });
});

describe("validateEnrollForm", () => {
  const options = { requireDescription: ["sms"] };

  it("checks the PIN repeat, the description policy and hex keys", () => {
    expect(
      validateEnrollForm(
        resolveEnrollForm(form({ pin: "1", pinRepeat: "2" }), context),
        options
      )
    ).toEqual(["pin"]);
    expect(
      validateEnrollForm(resolveEnrollForm(form({ type: "sms" }), context), options)
    ).toEqual(["description"]);
    expect(
      validateEnrollForm(
        resolveEnrollForm(form({ genkey: false, otpkey: "xyz" }), context),
        options
      )
    ).toEqual(["otpkey"]);
    expect(validateEnrollForm(resolveEnrollForm(form(), context), options)).toEqual([]);
  });

  it("applies the type-specific required fields", () => {
    expect(
      validateEnrollForm(
        resolveEnrollForm(form({ email: "", type: "email" }), context),
        options
      )
    ).toEqual(["email"]);
    expect(
      validateEnrollForm(
        resolveEnrollForm(
          form({ dynamicEmail: true, email: "", type: "email" }),
          context
        ),
        options
      )
    ).toEqual([]);
    expect(
      validateEnrollForm(
        resolveEnrollForm(
          form({ description: "x", phone: "abc", type: "sms" }),
          context
        ),
        options
      )
    ).toEqual(["phone"]);
    expect(
      validateEnrollForm(
        resolveEnrollForm(
          form({ otpkey: "0011", otplen: 20, type: "yubikey" }),
          context
        ),
        options
      )
    ).toEqual(["yubikeyKey", "yubikeyOtplen"]);
    expect(
      validateEnrollForm(resolveEnrollForm(form({ type: "remote" }), context), options)
    ).toEqual(["remoteServer", "remoteTarget"]);
    expect(
      validateEnrollForm(
        resolveEnrollForm(
          form({ remoteServerId: "1", remoteUser: "bob", type: "remote" }),
          context
        ),
        options
      )
    ).toEqual([]);
  });
});

describe("VASCO and SSH helpers", () => {
  it("reads the serial from a 496 character VASCO blob", () => {
    const serialHex = Array.from("VDP0001234", (char) =>
      char.charCodeAt(0).toString(16).padStart(2, "0")
    ).join("");
    const blob = serialHex + "00".repeat((496 - serialHex.length) / 2);

    expect(getVascoSerial(blob)).toBe("VDP0001234");
    expect(getVascoSerial("abcd")).toBe("");
    expect(getVascoSerial("zz".repeat(248))).toBe("");
  });

  it("uses the SSH key comment as description", () => {
    expect(getSshKeyComment("ssh-rsa AAAA user@host extra")).toBe("user@host extra");
    expect(getSshKeyComment("ssh-rsa AAAA")).toBe("");
  });
});
