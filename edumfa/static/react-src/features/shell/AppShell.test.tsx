import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell";
import { getSessionState, lockSession } from "@/auth/sessionStore";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubSession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const adminSession = {
  auth_token: "jwt-1",
  menus: ["tokens", "users", "machines", "config", "audit", "components"],
  realm: "",
  rights: ["tokenlist"],
  role: "admin",
  username: "admin"
};

function publicRoutes() {
  return [
    { path: "/register", respond: () => false },
    { path: "/realm/", respond: () => ({ realm1: { default: true, resolver: [] } }) },
    { path: "/token/", respond: () => ({ count: 0, current: 1, tokens: [] }) }
  ];
}

describe("AppShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.location.hash = "";
  });

  it("shows the login entry while logged out and sends protected routes to the login", async () => {
    vi.stubGlobal("fetch", createRouteFetchMock(publicRoutes()));

    renderWithProviders(<AppShell />, { route: "/token/list" });

    expect(
      await screen.findByRole("heading", { name: "Please sign in" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Switch to legacy UI" })).toHaveAttribute(
      "href",
      "?ui=legacy"
    );
    expect(screen.queryByRole("link", { name: "Tokens" })).not.toBeInTheDocument();
  });

  it("shows the menu of an administrator and logs out", async () => {
    vi.stubGlobal("fetch", createRouteFetchMock(publicRoutes()));
    stubSession(adminSession, { admin_dashboard: true, show_node: "node1" });
    const user = userEvent.setup();

    renderWithProviders(<AppShell />, { route: "/token/list" });

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tokens" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Config" })).toBeInTheDocument();
    expect(screen.getByText("node1")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /admin \(admin\)/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Logout" }));

    expect(getSessionState().session.authToken).toBeNull();
    expect(window.location.hash).toBe("#!/login");
  });

  it("hides the main menu in the token wizard and shows the user entry for users", () => {
    vi.stubGlobal("fetch", createRouteFetchMock(publicRoutes()));
    stubSession(
      { ...adminSession, menus: ["tokens", "users"], realm: "realm1", role: "user" },
      { token_wizard: true }
    );

    renderWithProviders(<AppShell />, { route: "/token/wizard" });

    expect(screen.queryByRole("link", { name: "Tokens" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /admin @realm1 \(user\)/ })
    ).toBeInTheDocument();
  });

  it("offers to create a default realm when none exists", async () => {
    const fetchMock = createRouteFetchMock([
      { path: "/register", respond: () => false },
      { path: "/realm/", respond: () => ({}) },
      { path: "/token/", respond: () => ({ count: 0, current: 1, tokens: [] }) },
      { method: "POST", path: "/resolver/deflocal", respond: () => 1 },
      { method: "POST", path: "/realm/defrealm", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    stubSession(adminSession);
    const user = userEvent.setup();

    renderWithProviders(<AppShell />, { route: "/token/list" });

    await user.click(await screen.findByRole("button", { name: "Create realm" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/realm/defrealm")).toHaveLength(1);
    });
    const [resolverCall] = findFetchCalls(fetchMock, "POST", "/resolver/deflocal");
    expect(resolverCall && getJsonRequestBody(resolverCall.init)).toEqual({
      filename: "/etc/passwd",
      type: "passwdresolver"
    });
  });

  it("unlocks a locked session with the password", async () => {
    const fetchMock = createRouteFetchMock([
      ...publicRoutes(),
      {
        method: "POST",
        path: "/auth",
        respond: () => ({
          menus: ["tokens"],
          realm: "realm1",
          rights: ["tokenlist"],
          role: "user",
          token: "jwt-2",
          username: "alice"
        })
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    stubSession({
      ...adminSession,
      menus: ["tokens"],
      realm: "realm1",
      role: "user",
      username: "alice"
    });
    lockSession();
    const user = userEvent.setup();

    renderWithProviders(<AppShell />, { route: "/token/list" });

    const dialog = await screen.findByRole("dialog", { name: "eduMFA UI is locked" });
    expect(dialog).toHaveTextContent("You are logged in as alice@realm1.");

    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(getSessionState().session.authToken).toBe("jwt-2");
    });
    expect(getSessionState().locked).toBe(false);
    const [authCall] = findFetchCalls(fetchMock, "POST", "/auth");
    expect(authCall && getJsonRequestBody(authCall.init)).toEqual({
      password: "secret",
      realm: "realm1",
      username: "alice"
    });

    // The dialog must not keep the password for the next lock.
    act(() => {
      lockSession();
    });
    const reopened = await screen.findByRole("dialog", { name: "eduMFA UI is locked" });
    expect(within(reopened).getByLabelText("Password")).toHaveValue("");
  });
});
