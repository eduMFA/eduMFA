import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { TokenDetailsPage } from "./TokenDetailsPage";
import type { TokenDetail } from "@/api/tokens";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession,
  type FetchRoute
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

const hotpToken: TokenDetail = {
  active: true,
  count: 3,
  count_window: 10,
  description: "desk token",
  failcount: 2,
  id: 1,
  info: { count_auth_max: "", tokenkind: "software" },
  locked: false,
  maxfail: 10,
  otplen: 6,
  realms: ["realm1"],
  resolver: "sqlres",
  revoked: false,
  rollout_state: "",
  serial: "HOTP0001",
  sync_window: 1000,
  tokengroup: [],
  tokentype: "hotp",
  user_id: "1001",
  user_realm: "realm1",
  username: "alice"
};

const realms = {
  realm1: { default: true, id: 1, resolver: [] },
  realm2: { default: false, id: 2, resolver: [] }
};

describe("TokenDetailsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the token properties, the assigned user and cross links", async () => {
    stubAdminSession();
    vi.stubGlobal("fetch", createBackendMock());

    renderPage();

    expect(await screen.findByText("hotp")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "#!/user/details/realm1/alice"
    );
    expect(
      screen.getByRole("link", { name: "View token in Audit log" })
    ).toHaveAttribute("href", "#!/audit/log?serial=HOTP0001");
    expect(screen.getByRole("link", { name: "Lost Token" })).toHaveAttribute(
      "href",
      "#!/token/lost/HOTP0001"
    );
    expect(within(rowFor("Realms")).getByText("realm1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset fail counter" })).toBeEnabled();
    // The rollover policy does not cover hotp, so no rollover is offered.
    expect(screen.queryByRole("link", { name: "Rollover" })).not.toBeInTheDocument();
  });

  it("disables the token from the status row", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole("button", { name: "Disable" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/token/disable")).toHaveLength(1);
    });

    const [disableCall] = findFetchCalls(fetchMock, "POST", "/token/disable");
    expect(getJsonRequestBody(disableCall?.init)).toEqual({ serial: "HOTP0001" });
  });

  it("edits the max fail counter through POST /token/set", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("hotp");
    const row = rowFor("Maxfail");
    await user.click(within(row).getByRole("button", { name: "Edit" }));

    const input = within(row).getByRole("textbox");
    await user.clear(input);
    await user.type(input, "20");
    await user.click(within(row).getByRole("button", { name: "Set max fail" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/token/set/HOTP0001")).toHaveLength(1);
    });

    const [setCall] = findFetchCalls(fetchMock, "POST", "/token/set/HOTP0001");
    expect(getJsonRequestBody(setCall?.init)).toEqual({ max_failcount: "20" });
  });

  it("asks before deleting a hardware token and returns to the list", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock({
      ...hotpToken,
      info: { tokenkind: "hardware" }
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "Do you really want to delete the Token HOTP0001 from user alice?"
      )
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete Token" }));

    await screen.findByText("list page");
    expect(findFetchCalls(fetchMock, "DELETE", "/token/HOTP0001")).toHaveLength(1);
  });

  it("assigns a user to an unassigned token", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock({
      ...hotpToken,
      resolver: "",
      user_id: "",
      user_realm: "",
      username: ""
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("hotp");
    // The default realm is preselected once the realm list has loaded.
    await waitFor(() => {
      expect(screen.getByLabelText("Realm")).toHaveValue("realm1");
    });

    await user.type(
      screen.getByRole("combobox", { name: fieldLabel("Username") }),
      // userEvent reads "[...]" as a key descriptor; "[[" types a literal bracket.
      "[[1002] bob (Bob Builder)"
    );
    await user.type(screen.getByLabelText("PIN/Password"), "1234");
    await user.type(screen.getByLabelText("Repeat PIN or password"), "1234");
    await user.click(screen.getByRole("button", { name: "Assign User" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/token/assign")).toHaveLength(1);
    });

    const [assignCall] = findFetchCalls(fetchMock, "POST", "/token/assign");
    expect(getJsonRequestBody(assignCall?.init)).toEqual({
      pin: "1234",
      realm: "realm1",
      serial: "HOTP0001",
      user: "bob"
    });
  });

  it("tests the token through /validate/check", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("hotp");
    await user.type(screen.getByLabelText("Test password"), "1234755224");
    await user.click(screen.getByRole("button", { name: "Test OTP only" }));

    await screen.findByText("Successfully authenticated.");

    const [checkCall] = findFetchCalls(fetchMock, "POST", "/validate/check");
    expect(getJsonRequestBody(checkCall?.init)).toEqual({
      otponly: "1",
      pass: "1234755224",
      serial: "HOTP0001"
    });
  });
});

function rowFor(label: string): HTMLElement {
  const row = screen.getByText(label).closest("tr");

  if (!row) {
    throw new Error(`No table row with label ${label}`);
  }

  return row;
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/token/details/:serial" element={<TokenDetailsPage />} />
      <Route path="/token/list" element={<div>list page</div>} />
    </Routes>,
    { route: "/token/details/HOTP0001" }
  );
}

function stubAdminSession(): void {
  stubLegacySession(
    {
      auth_token: "legacy-token",
      menus: [],
      realm: "",
      rights: [
        "tokenlist",
        "assign",
        "unassign",
        "auditlog",
        "delete",
        "disable",
        "enable",
        "revoke",
        "reset",
        "resync",
        "set",
        "setpin",
        "setrandompin",
        "tokenrealms",
        "losttoken",
        "manage_machine_tokens",
        "enrollHOTP"
      ],
      role: "admin",
      username: "admin"
    },
    { token_rollover: { totp: {} } }
  );
}

function createBackendMock(token: TokenDetail = hotpToken) {
  const routes: FetchRoute[] = [
    {
      path: "/token/",
      respond: () => ({ count: 1, current: 1, next: null, prev: null, tokens: [token] })
    },
    { path: "/realm/", respond: () => realms },
    { path: "/system/", respond: () => ({ PrependPin: "True" }) },
    { path: "/machine/token", respond: () => [] },
    { path: "/application/", respond: () => ({}) },
    { path: "/user/", respond: () => [] },
    { method: "POST", path: "/token/disable", respond: () => 1 },
    { method: "POST", path: "/token/set/HOTP0001", respond: () => 1 },
    { method: "POST", path: "/token/assign", respond: () => true },
    { method: "POST", path: "/validate/check", respond: () => true },
    { method: "DELETE", path: "/token/HOTP0001", respond: () => 1 }
  ];

  return createRouteFetchMock(routes);
}
