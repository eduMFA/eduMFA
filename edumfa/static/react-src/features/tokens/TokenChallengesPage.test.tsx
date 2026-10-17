import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TokenChallengesPage } from "./TokenChallengesPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const challenges = [
  {
    challenge: "",
    expiration: "2026-10-16T10:05:00",
    id: 7,
    otp_received: false,
    received_count: 0,
    serial: "HOTP0001",
    timestamp: "2026-10-16T10:00:00",
    transaction_id: "0123456789"
  }
];

describe("TokenChallengesPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists challenges and filters by serial through the path", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<TokenChallengesPage />, { route: "/token/challenges" });

    expect(await screen.findByRole("link", { name: "HOTP0001" })).toHaveAttribute(
      "href",
      "#!/token/details/HOTP0001"
    );
    expect(screen.getByText("Total Challenges: 1")).toBeInTheDocument();
    expect(screen.getByText("0123456789")).toBeInTheDocument();

    const [listCall] = findFetchCalls(fetchMock, "GET", "/token/challenges/");
    expect(listCall?.url.searchParams.get("page")).toBe("1");
    expect(listCall?.url.searchParams.get("pagesize")).toBe("15");
    expect(listCall?.url.searchParams.get("sortby")).toBe("timestamp");
    expect(listCall?.url.searchParams.get("sortdir")).toBe("asc");

    await user.type(screen.getByLabelText("serial"), "HOTP");

    await screen.findByText("No open challenges.");
    expect(findFetchCalls(fetchMock, "GET", "/token/challenges/*HOTP*")).toHaveLength(
      1
    );
  });

  it("sorts on the server when a header is clicked", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<TokenChallengesPage />, { route: "/token/challenges" });

    await screen.findByRole("link", { name: "HOTP0001" });
    await user.click(screen.getByRole("button", { name: "Expiration" }));

    await waitFor(() => {
      const lastCall = findFetchCalls(fetchMock, "GET", "/token/challenges/").at(-1);
      expect(lastCall?.url.searchParams.get("sortby")).toBe("expiration");
      expect(lastCall?.url.searchParams.get("sortdir")).toBe("asc");
    });

    expect(screen.getByRole("columnheader", { name: /Expiration/ })).toHaveAttribute(
      "aria-sort",
      "ascending"
    );
  });
});

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["tokenlist", "getchallenges"],
    role: "admin",
    username: "admin"
  });
}

function createBackendMock() {
  return createRouteFetchMock([
    {
      path: "/token/challenges/",
      respond: () => ({ challenges, count: 1, current: 1, next: null, prev: null })
    },
    {
      path: "/token/challenges/*HOTP*",
      respond: () => ({ challenges: [], count: 0, current: 1, next: null, prev: null })
    }
  ]);
}
