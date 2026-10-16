import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MachineListPage } from "./MachineListPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  stubLegacySession
} from "../../tests/fetchMockUtils";
import { renderWithProviders } from "../../tests/renderWithProviders";

const machines = [
  {
    hostname: ["web1", "web1.example.com"],
    id: "m1",
    ip: "10.0.0.1",
    resolver_name: "hosts1"
  },
  { hostname: "db1", id: "m2", ip: "10.0.0.2", resolver_name: "hosts1" }
];

describe("MachineListPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists machines prefiltered by the ?resolver deep link", async () => {
    stubAdminSession();
    const fetchMock = createRouteFetchMock([
      { path: "/machine/", respond: () => machines }
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<MachineListPage />, {
      route: "/machine/list?resolver=hosts1"
    });

    expect(
      await screen.findByRole("link", { name: "web1, web1.example.com" })
    ).toHaveAttribute("href", "#!/machine/details/m1/hosts1");
    expect(screen.getByLabelText("Machine Resolver")).toHaveValue("hosts1");

    const [listCall] = findFetchCalls(fetchMock, "GET", "/machine/");
    expect(listCall?.url.searchParams.get("resolver")).toBe("hosts1");
    expect(listCall?.url.searchParams.has("hostname")).toBe(false);
  });

  it("refetches when a column filter changes", async () => {
    stubAdminSession();
    const fetchMock = createRouteFetchMock([
      { path: "/machine/", respond: () => machines }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<MachineListPage />, { route: "/machine/list" });

    await screen.findByText("db1");
    await user.type(screen.getByLabelText("hostname"), "web");

    await waitFor(() => {
      const lastCall = findFetchCalls(fetchMock, "GET", "/machine/").at(-1);
      expect(lastCall?.url.searchParams.get("hostname")).toBe("web");
    });
  });
});

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["machinelist"],
    role: "admin",
    username: "admin"
  });
}
