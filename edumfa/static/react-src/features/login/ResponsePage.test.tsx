import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { setPendingChallenge, resetLoginFlow } from "./loginFlowStore";
import type { PendingChallenge } from "./loginFlow";
import { ResponsePage } from "./ResponsePage";
import {
  createLegacyAuthBridge,
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const sessionValue = {
  menus: ["tokens"],
  realm: "realm1",
  rights: ["tokenlist"],
  role: "user",
  token: "jwt-1",
  username: "alice"
};

const baseChallenge: PendingChallenge = {
  image: null,
  message: "Please confirm the authentication on your mobile device!",
  polling: false,
  realm: "",
  serials: ["PUSH0001"],
  showInput: false,
  transactionId: "tx-1",
  u2fSignRequests: [],
  username: "alice",
  webAuthnSignRequests: []
};

function installBridge(): { login: ReturnType<typeof vi.fn> } {
  const bridge = { ...createLegacyAuthBridge({}), login: vi.fn() };
  vi.stubGlobal("eduMfaLegacyAuth", bridge);

  return bridge;
}

describe("ResponsePage", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "credentials");
    resetLoginFlow();
  });

  it("asks to log in when no challenge is pending", () => {
    renderWithProviders(<ResponsePage />, { route: "/response" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "There is no pending challenge."
    );
  });

  it("finishes the login once the polled challenge is confirmed", async () => {
    vi.useFakeTimers();
    let polls = 0;
    const bridge = installBridge();
    const fetchMock = createRouteFetchMock([
      {
        path: "/validate/polltransaction",
        respond: () => {
          polls += 1;

          return polls >= 2;
        }
      },
      { method: "POST", path: "/auth", respond: () => sessionValue }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    setPendingChallenge({ ...baseChallenge, polling: true, realm: "realm1" });

    renderWithProviders(<ResponsePage />, { route: "/response" });

    expect(
      screen.getByText("Please confirm the authentication on your mobile device!")
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for the confirmation"
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(findFetchCalls(fetchMock, "GET", "/validate/polltransaction")).toHaveLength(
      1
    );
    expect(findFetchCalls(fetchMock, "POST", "/auth")).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const [pollCall] = findFetchCalls(fetchMock, "GET", "/validate/polltransaction");
    expect(pollCall?.url.searchParams.get("transaction_id")).toBe("tx-1");
    const [authCall] = findFetchCalls(fetchMock, "POST", "/auth");
    expect(authCall && getJsonRequestBody(authCall.init)).toEqual({
      password: "",
      realm: "realm1",
      transaction_id: "tx-1",
      username: "alice"
    });
    expect(bridge.login).toHaveBeenCalledTimes(1);
  });

  it("signs a WebAuthn challenge and sends the assertion", async () => {
    const bridge = installBridge();
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/auth", respond: () => sessionValue }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("PublicKeyCredential", {});
    const get = vi.fn().mockResolvedValue({
      getClientExtensionResults: () => ({}),
      id: "cred-1",
      response: {
        authenticatorData: new Uint8Array([4, 5, 6]).buffer,
        clientDataJSON: new Uint8Array([251, 255]).buffer,
        signature: new Uint8Array([1, 2, 3]).buffer,
        userHandle: null
      },
      type: "public-key"
    });
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { get }
    });
    setPendingChallenge({
      ...baseChallenge,
      message: "Please confirm with your WebAuthn token",
      serials: ["WAN0001"],
      webAuthnSignRequests: [
        {
          allowCredentials: [{ id: "AQID", type: "public-key" }],
          challenge: "-_8",
          rpId: "mfa.example.com"
        }
      ]
    });

    renderWithProviders(<ResponsePage />, { route: "/response" });

    await waitFor(() => {
      expect(bridge.login).toHaveBeenCalledTimes(1);
    });
    expect(get).toHaveBeenCalledTimes(1);
    const [authCall] = findFetchCalls(fetchMock, "POST", "/auth");
    expect(authCall && getJsonRequestBody(authCall.init)).toEqual({
      authenticatordata: "BAUG",
      clientdata: "-_8",
      credentialid: "cred-1",
      password: "",
      signaturedata: "AQID",
      transaction_id: "tx-1",
      username: "alice"
    });
  });

  it("shows why the WebAuthn ceremony failed", async () => {
    installBridge();
    vi.stubGlobal("fetch", createRouteFetchMock([]));
    vi.stubGlobal("PublicKeyCredential", {});
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: {
        get: vi
          .fn()
          .mockRejectedValue(new DOMException("User cancelled", "NotAllowedError"))
      }
    });
    setPendingChallenge({
      ...baseChallenge,
      serials: ["WAN0001"],
      webAuthnSignRequests: [
        {
          allowCredentials: [{ id: "AQID", type: "public-key" }],
          challenge: "-_8",
          rpId: "mfa.example.com"
        }
      ]
    });

    renderWithProviders(<ResponsePage />, { route: "/response" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The authentication was cancelled or timed out. / User cancelled"
    );
  });
});
