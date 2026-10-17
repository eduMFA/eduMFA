import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TokenListPage } from "./TokenListPage";
import type { LegacyWebUiSettings } from "@/global";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const hotpToken = {
  active: true,
  count: 0,
  count_window: 10,
  description: "desk token",
  failcount: 0,
  id: 1,
  info: {},
  locked: false,
  maxfail: 10,
  otplen: 6,
  realms: ["realm1"],
  resolver: "sqlres",
  revoked: false,
  rollout_state: "",
  serial: "HOTP0001",
  sync_window: 1000,
  tokentype: "hotp",
  user_id: "1001",
  user_realm: "realm1",
  username: "alice"
};

const totpToken = {
  ...hotpToken,
  active: false,
  description: "phone",
  failcount: 3,
  id: 2,
  realms: [],
  resolver: "",
  serial: "TOTP0002",
  tokentype: "totp",
  user_id: "",
  user_realm: "",
  username: ""
};

describe("TokenListPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists tokens with the admin columns and the policy page size", async () => {
    stubAdminSession({ token_page_size: 25, user_details: true });
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<TokenListPage />, { route: "/token/list" });

    expect(await screen.findByRole("link", { name: "HOTP0001" })).toHaveAttribute(
      "href",
      "#!/token/details/HOTP0001"
    );
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "#!/user/details/realm1/alice"
    );
    expect(screen.getByText("total tokens: 2")).toBeInTheDocument();
    // The `user_details` policy adds the user id and resolver columns.
    expect(screen.getByText("1001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "sqlres" })).toHaveAttribute(
      "href",
      "#!/config/resolvers/list"
    );

    const [listCall] = findFetchCalls(fetchMock, "GET", "/token/");
    expect(listCall?.url.searchParams.get("page")).toBe("1");
    expect(listCall?.url.searchParams.get("pagesize")).toBe("25");
    expect(listCall?.url.searchParams.get("sortby")).toBe("serial");
    expect(listCall?.url.searchParams.get("sortdir")).toBe("asc");
    expect(listCall?.url.searchParams.has("serial")).toBe(false);
  });

  it("hides the user columns for the user role", async () => {
    stubLegacySession({
      auth_token: "legacy-token",
      menus: [],
      realm: "realm1",
      rights: ["disable", "enable"],
      role: "user",
      username: "alice"
    });
    vi.stubGlobal("fetch", createBackendMock());

    renderWithProviders(<TokenListPage />, { route: "/token/list" });

    await screen.findByRole("link", { name: "HOTP0001" });
    expect(screen.queryByText("Token realms")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "alice" })).not.toBeInTheDocument();
    expect(screen.queryByText("1001")).not.toBeInTheDocument();
  });

  it("sends debounced contains filters and sorts on the server", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<TokenListPage />, { route: "/token/list" });

    await screen.findByRole("link", { name: "HOTP0001" });
    await user.type(screen.getByLabelText("type"), "hotp");

    await waitFor(() => {
      const lastCall = findFetchCalls(fetchMock, "GET", "/token/").at(-1);
      expect(lastCall?.url.searchParams.get("type")).toBe("*hotp*");
    });

    await user.click(screen.getByRole("button", { name: "description" }));

    await waitFor(() => {
      const lastCall = findFetchCalls(fetchMock, "GET", "/token/").at(-1);
      expect(lastCall?.url.searchParams.get("sortby")).toBe("description");
      expect(lastCall?.url.searchParams.get("sortdir")).toBe("asc");
    });

    await user.click(screen.getByRole("button", { name: "description" }));

    await waitFor(() => {
      const lastCall = findFetchCalls(fetchMock, "GET", "/token/").at(-1);
      expect(lastCall?.url.searchParams.get("sortdir")).toBe("desc");
    });
  });

  it("only filters on Enter when the search_on_enter policy is set", async () => {
    stubAdminSession({ search_on_enter: true });
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<TokenListPage />, { route: "/token/list" });

    await screen.findByRole("link", { name: "HOTP0001" });
    await user.type(screen.getByLabelText("serial"), "HOTP");
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });

    expect(
      findFetchCalls(fetchMock, "GET", "/token/").some((call) =>
        call.url.searchParams.has("serial")
      )
    ).toBe(false);

    await user.keyboard("{Enter}");

    await waitFor(() => {
      const lastCall = findFetchCalls(fetchMock, "GET", "/token/").at(-1);
      expect(lastCall?.url.searchParams.get("serial")).toBe("*HOTP*");
    });
  });

  it("toggles a token and resets a fail counter from the badges", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<TokenListPage />, { route: "/token/list" });

    await screen.findByRole("link", { name: "HOTP0001" });
    await user.click(screen.getByRole("button", { name: "Disable token" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/token/disable")).toHaveLength(1);
    });

    const [disableCall] = findFetchCalls(fetchMock, "POST", "/token/disable");
    expect(getJsonRequestBody(disableCall?.init)).toEqual({ serial: "HOTP0001" });

    const resetButtons = screen.getAllByRole("button", { name: "Reset Failcounter" });
    await user.click(resetButtons[1] as HTMLElement);

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/token/reset")).toHaveLength(1);
    });

    const [resetCall] = findFetchCalls(fetchMock, "POST", "/token/reset");
    expect(getJsonRequestBody(resetCall?.init)).toEqual({ serial: "TOTP0002" });
  });
});

function stubAdminSession(settings: LegacyWebUiSettings = {}): void {
  stubLegacySession(
    {
      auth_token: "legacy-token",
      menus: [],
      realm: "",
      rights: ["tokenlist", "enable", "disable", "reset", "getserial", "getchallenges"],
      role: "admin",
      username: "admin"
    },
    settings
  );
}

function createBackendMock() {
  return createRouteFetchMock([
    {
      path: "/token/",
      respond: () => ({
        count: 2,
        current: 1,
        next: null,
        prev: null,
        tokens: [hotpToken, totpToken]
      })
    },
    { method: "POST", path: "/token/disable", respond: () => 1 },
    { method: "POST", path: "/token/reset", respond: () => 1 }
  ]);
}
