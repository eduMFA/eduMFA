import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { EnrollTokenPage } from "./EnrollTokenPage";
import { buildOtpListRows } from "./results/OtpListResult";
import type { WebUiSettingsPayload } from "@/auth/session";
import { getSessionState } from "@/auth/sessionStore";
import {
  stubSession,
  type TestSessionUser,
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession,
  type FetchRoute
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const adminUser: TestSessionUser = {
  auth_token: "legacy-token",
  menus: [],
  realm: "",
  rights: ["tokenlist", "enrollHOTP", "enrollTOTP", "enrollSMS", "hotp_2step=allow"],
  role: "admin",
  username: "admin"
};

const plainUser: TestSessionUser = {
  auth_token: "legacy-token",
  menus: [],
  realm: "realm2",
  rights: ["enrollTOTP", "enrollWEBAUTHN", "setdescription", "enrollpin"],
  role: "user",
  username: "cornelius"
};

const qrImage = "data:image/png;base64,QUJD";

function rightsRoute(types: Record<string, string>): FetchRoute {
  return { path: "/auth/rights", respond: () => types };
}

const adminRoutes: FetchRoute[] = [
  rightsRoute({
    hotp: "HOTP: Event based One Time Passwords",
    sms: "SMS",
    totp: "TOTP"
  }),
  {
    path: "/realm/",
    respond: () => ({
      realm1: { default: true, resolver: [] },
      realm2: { resolver: [] }
    })
  },
  { path: "/system/", respond: () => ({ "hotp.hashlib": "sha256" }) },
  {
    path: "/user/",
    respond: () => [
      {
        email: "alice@example.com",
        mobile: "+491234",
        resolver: "resolver1",
        userid: "1002",
        username: "alice"
      }
    ]
  }
];

const hotpDetail = {
  googleurl: { img: qrImage, value: "otpauth://hotp/OATH0001?secret=GEZD" },
  otpkey: {
    img: qrImage,
    value: "seed://3132333435363738393031323334353637383930",
    value_b32: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
  },
  rollout_state: "",
  serial: "OATH0001"
};

function renderPage(mode: "enroll" | "rollover" | "wizard", route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/token/enroll/*" element={<EnrollTokenPage mode="enroll" />} />
      <Route
        path="/token/rollover/:tokenType/:tokenSerial"
        element={<EnrollTokenPage mode="rollover" />}
      />
      <Route path="/token/wizard" element={<EnrollTokenPage mode={mode} />} />
    </Routes>,
    { route }
  );
}

describe("EnrollTokenPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "credentials");
  });

  it("enrolls an HOTP token for a picked user and shows the QR code", async () => {
    stubLegacySession(adminUser, { default_tokentype: "hotp", show_seed: true });
    const fetchMock = createRouteFetchMock([
      ...adminRoutes,
      {
        detail: () => hotpDetail,
        method: "POST",
        path: "/token/init",
        respond: () => true
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("enroll", "/token/enroll//");

    await waitFor(() => {
      expect(screen.getByLabelText("Hash algorithm")).toHaveValue("sha256");
    });
    expect(screen.getByLabelText("Token type")).toHaveValue("hotp");
    expect(screen.getByLabelText("Realm")).toHaveValue("realm1");
    expect(screen.getByRole("link", { name: "Enroll Token" })).toHaveAttribute(
      "data-active",
      "true"
    );

    await user.type(screen.getByLabelText("Description"), "Office phone");
    await user.type(
      screen.getByRole("combobox", { name: "Username" }),
      "[[1002] alice (Alice Adams)"
    );
    await user.click(screen.getByRole("button", { name: "Enroll Token" }));

    await screen.findByAltText("QR code of the token");
    expect(screen.getByRole("link", { name: "OATH0001" })).toHaveAttribute(
      "href",
      "#!/token/details/OATH0001"
    );
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "#!/user/details/realm1/alice"
    );

    const [initCall] = findFetchCalls(fetchMock, "POST", "/token/init");
    const body = getJsonRequestBody(initCall?.init);
    expect(body).toMatchObject({
      "2stepinit": false,
      description: "Office phone",
      genkey: true,
      hashlib: "sha256",
      otplen: 6,
      realm: "realm1",
      timeStep: 30,
      type: "hotp",
      user: "alice"
    });
    expect(body).not.toHaveProperty("otpkey");
    expect(body).not.toHaveProperty("pin");
    expect(body).not.toHaveProperty("rollover");

    await user.click(screen.getByRole("button", { name: "The OTP key" }));
    expect(
      screen.getByText("Hex: 3132333435363738393031323334353637383930")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enroll a new token" }));
    expect(screen.getByLabelText("Token type")).toBeInTheDocument();
  });

  it("presets the contact data of the picked user and warns about the default type", async () => {
    stubLegacySession(adminUser, { default_tokentype: "spass" });
    vi.stubGlobal("fetch", createRouteFetchMock(adminRoutes));
    const user = userEvent.setup();

    renderPage("enroll", "/token/enroll/realm2/alice");

    await screen.findByText(
      'Your user has no permission to enroll the default tokentype "spass". Using "hotp" instead.'
    );
    expect(screen.getByLabelText("Realm")).toHaveValue("realm2");
    expect(screen.getByRole("combobox", { name: "Username" })).toHaveValue("alice");

    await user.selectOptions(screen.getByLabelText("Token type"), "sms");
    await waitFor(() => {
      expect(screen.getByLabelText(/^Phone number/)).toHaveValue("+491234");
    });
    expect(screen.getByRole("button", { name: "+491234" })).toBeInTheDocument();
  });

  it("sends the client part of a two-step enrollment", async () => {
    stubLegacySession(adminUser, { default_tokentype: "hotp" });
    const fetchMock = createRouteFetchMock([
      ...adminRoutes,
      {
        path: "/token/",
        respond: () => ({
          count: 1,
          current: 1,
          next: null,
          prev: null,
          tokens: [{ rollout_state: "clientwait", serial: "OATH0002" }]
        })
      },
      {
        detail: (_url, init) =>
          getJsonRequestBody(init).otpkeyformat === "base32check"
            ? { rollout_state: "", serial: "OATH0002" }
            : { ...hotpDetail, rollout_state: "clientwait", serial: "OATH0002" },
        method: "POST",
        path: "/token/init",
        respond: () => true
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("enroll", "/token/enroll//");

    await user.click(
      await screen.findByLabelText(
        "Use two-step enrollment with the privacyIDEA Authenticator App"
      )
    );
    await user.click(screen.getByRole("button", { name: "Enroll Token" }));

    await user.type(await screen.findByLabelText("Client Part"), "ABCD EFGH");
    expect(screen.queryByRole("button", { name: "Enroll a new token" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Enroll Token" }));

    await screen.findByRole("button", { name: "Enroll a new token" });
    const initCalls = findFetchCalls(fetchMock, "POST", "/token/init");
    expect(getJsonRequestBody(initCalls[0]?.init)).toMatchObject({ "2stepinit": true });
    expect(getJsonRequestBody(initCalls[1]?.init)).toEqual({
      otpkey: "ABCDEFGH",
      otpkeyformat: "base32check",
      serial: "OATH0002",
      type: "hotp"
    });
  });

  it("rolls over the user's own token with the fixed type", async () => {
    stubLegacySession(plainUser, {});
    const fetchMock = createRouteFetchMock([
      rightsRoute({ totp: "TOTP: Time based One Time Passwords" }),
      { path: "/system/", respond: () => ({}) },
      {
        detail: () => ({ ...hotpDetail, serial: "TOTP0001" }),
        method: "POST",
        path: "/token/init",
        respond: () => true
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("rollover", "/token/rollover/totp/TOTP0001");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You are about to rollover your token!"
    );
    expect(screen.queryByLabelText("Token type")).toBeNull();
    expect(screen.queryByLabelText("PIN/Password")).toBeNull();
    expect(screen.getByLabelText("Timestep")).toBeInTheDocument();

    const button = await screen.findByRole("button", { name: "Rollover Token" });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    await user.click(button);

    await screen.findByRole("button", { name: "Enroll a new token" });
    const [initCall] = findFetchCalls(fetchMock, "POST", "/token/init");
    expect(getJsonRequestBody(initCall?.init)).toMatchObject({
      realm: "realm2",
      rollover: true,
      serial: "TOTP0001",
      type: "totp",
      user: "cornelius"
    });
  });

  it("hides the navigation in the wizard and logs out afterwards", async () => {
    const settings: WebUiSettingsPayload = {
      default_tokentype: "totp",
      token_wizard: true
    };
    stubSession(plainUser, settings);
    const fetchMock = createRouteFetchMock([
      rightsRoute({ totp: "TOTP" }),
      { path: "/system/", respond: () => ({}) },
      {
        detail: () => ({ ...hotpDetail, serial: "TOTP0002" }),
        method: "POST",
        path: "/token/init",
        respond: () => true
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("wizard", "/token/wizard");

    expect(screen.queryByRole("link", { name: "All tokens" })).toBeNull();
    expect(screen.queryByLabelText("Token type")).toBeNull();
    // Without an otp_pin_minlength policy the wizard asks for no PIN.
    expect(screen.queryByLabelText("PIN/Password")).toBeNull();

    const button = screen.getByRole("button", { name: "Enroll Token" });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    await user.click(button);

    await user.click(await screen.findByRole("button", { name: "Logout" }));
    expect(getSessionState().session.authToken).toBeNull();
    expect(screen.queryByText(/successfully enrolled/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Regenerate QR Code" })).toBeNull();
  });

  it("runs the WebAuthn ceremony and sends the attestation as second step", async () => {
    stubLegacySession(plainUser, { default_tokentype: "webauthn" });
    vi.stubGlobal("PublicKeyCredential", {});
    const create = vi.fn().mockResolvedValue({
      getClientExtensionResults: () => ({}),
      response: {
        attestationObject: new Uint8Array([1, 2, 3]).buffer,
        clientDataJSON: new Uint8Array([4, 5]).buffer
      },
      type: "public-key"
    });
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { create }
    });
    const fetchMock = createRouteFetchMock([
      rightsRoute({ webauthn: "WebAuthn" }),
      { path: "/system/", respond: () => ({}) },
      {
        detail: (_url, init) =>
          getJsonRequestBody(init).regdata === undefined
            ? {
                rollout_state: "clientwait",
                serial: "WAN0001",
                webAuthnRegisterRequest: {
                  displayName: "Cornelius",
                  name: "cornelius",
                  nonce: "AQID",
                  pubKeyCredAlgorithms: [{ alg: -7, type: "public-key" }],
                  relyingParty: { id: "mfa.example.com", name: "eduMFA" },
                  serialNumber: "WAN0001",
                  transaction_id: "tx-1"
                }
              }
            : {
                serial: "WAN0001",
                webAuthnRegisterResponse: { subject: "Yubico U2F EE Serial 123" }
              },
        method: "POST",
        path: "/token/init",
        respond: () => true
      },
      {
        path: "/token/",
        respond: () => ({
          count: 1,
          current: 1,
          next: null,
          prev: null,
          tokens: [{ rollout_state: "", serial: "WAN0001" }]
        })
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("enroll", "/token/enroll//");

    const button = screen.getByRole("button", { name: "Enroll Token" });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    await user.click(button);

    await screen.findByText("Yubico U2F EE Serial 123");
    expect(screen.getByText("Token enrolled")).toBeInTheDocument();
    expect(create).toHaveBeenCalledTimes(1);

    const initCalls = findFetchCalls(fetchMock, "POST", "/token/init");
    expect(getJsonRequestBody(initCalls[1]?.init)).toEqual({
      clientdata: "BAU",
      realm: "realm2",
      regdata: "AQID",
      serial: "WAN0001",
      transaction_id: "tx-1",
      type: "webauthn",
      user: "cornelius"
    });
    await screen.findByRole("button", { name: "Enroll a new token" });
  });
});

describe("buildOtpListRows", () => {
  it("lays the OTP values out column by column", () => {
    const otps = Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => [String(index), `otp${String(index)}`])
    );
    const rows = buildOtpListRows(otps);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual([
      "0",
      "otp0",
      "3",
      "otp3",
      "6",
      "otp6",
      "9",
      "otp9",
      "",
      ""
    ]);
    expect(rows[2]).toEqual([
      "2",
      "otp2",
      "5",
      "otp5",
      "8",
      "otp8",
      "11",
      "otp11",
      "",
      ""
    ]);
  });
});
