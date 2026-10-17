import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetLoginFlow } from "./loginFlowStore";
import { LoginPage } from "./LoginPage";
import { ResponsePage } from "./ResponsePage";
import {
  createEnvelopeResponse,
  createLegacyAuthBridge,
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const sessionValue = {
  menus: ["tokens"],
  realm: "",
  rights: ["tokenlist"],
  role: "admin",
  token: "jwt-1",
  username: "admin"
};

function renderLogin(route = "/login") {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/response" element={<ResponsePage />} />
      <Route path="/token/list" element={<div>token list</div>} />
      <Route path="/dashboard" element={<div>dashboard</div>} />
    </Routes>,
    { route }
  );
}

function setHiddenInputs(values: Record<string, string>): void {
  document.body.innerHTML = Object.entries(values)
    .map(([id, value]) => `<input type="hidden" id="${id}" value="${value}">`)
    .join("");
}

function installBridge(): { login: ReturnType<typeof vi.fn> } {
  const bridge = { ...createLegacyAuthBridge({}), login: vi.fn() };
  vi.stubGlobal("eduMfaLegacyAuth", bridge);

  return bridge;
}

describe("LoginPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetLoginFlow();
    document.body.innerHTML = "";
  });

  it("logs in with credentials and hands the session to the Angular bridge", async () => {
    setHiddenInputs({ REALMS: "realm2,realm1" });
    const bridge = installBridge();
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/auth", respond: () => sessionValue }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderLogin();

    const loginButton = screen.getByRole("button", { name: "Log In" });
    expect(loginButton).toBeDisabled();

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.selectOptions(screen.getByLabelText("Realm"), "realm2");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(loginButton);

    await waitFor(() => {
      expect(bridge.login).toHaveBeenCalledTimes(1);
    });

    const [authCall] = findFetchCalls(fetchMock, "POST", "/auth");
    expect(authCall && getJsonRequestBody(authCall.init)).toEqual({
      password: "secret",
      realm: "realm2",
      username: "alice"
    });
    expect(bridge.login).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { status: true, value: sessionValue }
      })
    );
  });

  it("sets the React session and opens the start page without a bridge", async () => {
    vi.stubGlobal("eduMfaLegacyAuth", undefined);
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        {
          method: "POST",
          path: "/auth",
          respond: () => ({ ...sessionValue, admin_dashboard: true })
        }
      ])
    );
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await screen.findByText("dashboard");
  });

  it("moves to the response page for a challenge and sends the OTP", async () => {
    const bridge = installBridge();
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(
        createEnvelopeResponse(
          { realm: "", role: "user", username: "alice" },
          {
            message: "Please enter OTP:",
            multi_challenge: [
              {
                client_mode: "interactive",
                message: "Please enter OTP:",
                serial: "HOTP0001",
                transaction_id: "tx-1"
              }
            ],
            transaction_id: "tx-1"
          }
        )
      )
      .mockResolvedValueOnce(createEnvelopeResponse(sessionValue));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await screen.findByRole("heading", { name: "Response" });
    expect(screen.getByText("Please enter OTP:")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Response"), "123456");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(bridge.login).toHaveBeenCalledTimes(1);
    });

    const calls = findFetchCalls(fetchMock, "POST", "/auth");
    expect(calls).toHaveLength(2);
    expect(calls[1] && getJsonRequestBody(calls[1].init)).toEqual({
      password: "123456",
      transaction_id: "tx-1",
      username: "alice"
    });
  });

  it("offers the web server user and the credentials form", async () => {
    setHiddenInputs({ FORCE_REMOTE_USER: "False", REMOTE_USER: "foo" });
    installBridge();
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/auth", respond: () => sessionValue }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderLogin();

    expect(screen.getByRole("heading", { name: "Login as foo" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/auth")).toHaveLength(1);
    });
    const [authCall] = findFetchCalls(fetchMock, "POST", "/auth");
    expect(authCall && getJsonRequestBody(authCall.init)).toEqual({
      password: "",
      username: "foo"
    });

    await user.click(screen.getByRole("button", { name: "Login with credentials" }));

    expect(screen.getByLabelText("Username")).toHaveValue("foo");
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("hides the credentials form when the web server user is forced", () => {
    setHiddenInputs({ FORCE_REMOTE_USER: "True", REMOTE_USER: "foo" });

    renderLogin();

    expect(
      screen.queryByRole("button", { name: "Login with credentials" })
    ).not.toBeInTheDocument();
  });

  it("shows the HSM warning instead of the form", () => {
    setHiddenInputs({ HSM_READY: "False" });

    renderLogin();

    expect(screen.getByRole("alert")).toHaveTextContent("The HSM is not ready.");
    expect(screen.queryByLabelText("Username")).not.toBeInTheDocument();
  });

  it("reports a rejected login", async () => {
    installBridge();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            result: {
              error: {
                code: 4031,
                message: "Authentication failure. Wrong credentials"
              },
              status: false
            },
            version: "eduMFA"
          }),
          { status: 401 }
        )
      )
    );
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await screen.findByText(
      "Authentication failed. Authentication failure. Wrong credentials"
    );
  });
});
