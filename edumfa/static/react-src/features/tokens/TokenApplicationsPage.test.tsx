import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { TokenApplicationsPage } from "./TokenApplicationsPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const sshAssignment = {
  application: "ssh",
  id: 1,
  machine_id: null,
  options: { service_id: "webserver", user: "root" },
  resolver: null,
  serial: "SSHKEY1",
  type: "sshkey"
};

const offlineAssignment = {
  application: "offline",
  id: 2,
  machine_id: null,
  options: { count: "100", rounds: "10000" },
  resolver: null,
  serial: "HOTP0001",
  type: "hotp"
};

describe("TokenApplicationsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the ssh attachments and filters by option", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("/token/applications/ssh");

    expect(await screen.findByRole("link", { name: "SSHKEY1" })).toHaveAttribute(
      "href",
      "#!/token/details/SSHKEY1"
    );
    expect(screen.getByText("webserver")).toBeInTheDocument();
    expect(screen.getByText("root")).toBeInTheDocument();

    const [listCall] = findFetchCalls(fetchMock, "GET", "/machine/token");
    expect(listCall?.url.searchParams.get("application")).toBe("ssh");
    expect(listCall?.url.searchParams.get("sortby")).toBe("serial");
    expect(listCall?.url.searchParams.get("sortdir")).toBe("asc");

    await user.type(screen.getByLabelText("Service ID"), "web");

    await waitFor(() => {
      const lastCall = findFetchCalls(fetchMock, "GET", "/machine/token").at(-1);
      expect(lastCall?.url.searchParams.get("service_id")).toBe("*web*");
    });
  });

  it("switches to the offline application through the route", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("/token/applications/ssh");

    await screen.findByRole("link", { name: "SSHKEY1" });
    await user.selectOptions(screen.getByLabelText("Application"), "offline");

    expect(await screen.findByRole("link", { name: "HOTP0001" })).toBeInTheDocument();
    expect(screen.getByText("10000")).toBeInTheDocument();
    expect(screen.getByLabelText("Rounds")).toBeInTheDocument();
    expect(screen.queryByLabelText("Service ID")).not.toBeInTheDocument();

    const lastCall = findFetchCalls(fetchMock, "GET", "/machine/token").at(-1);
    expect(lastCall?.url.searchParams.get("application")).toBe("offline");
  });
});

function renderPage(route: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/token/applications/:application"
        element={<TokenApplicationsPage />}
      />
    </Routes>,
    { route }
  );
}

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["tokenlist", "machinelist", "manage_machine_tokens"],
    role: "admin",
    username: "admin"
  });
}

function createBackendMock() {
  return createRouteFetchMock([
    {
      path: "/machine/token",
      respond: (url) =>
        url.searchParams.get("application") === "offline"
          ? [offlineAssignment]
          : [sshAssignment]
    }
  ]);
}
