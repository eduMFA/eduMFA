import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MachineResolverListPage } from "./MachineResolverListPage";
import type { WebUiSettingsPayload } from "@/auth/session";
import {
  createRouteFetchMock,
  findFetchCalls,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const machineResolvers = {
  hosts1: { data: { filename: "/etc/hosts" }, resolvername: "hosts1", type: "hosts" },
  ldap1: {
    data: { LDAPURI: "ldap://ldap.example.com" },
    resolvername: "ldap1",
    type: "ldap"
  }
};

const allRights = ["mresolverread", "mresolverwrite", "mresolverdelete"];

describe("MachineResolverListPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the resolvers with links to their editors", async () => {
    stubSession(allRights);
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        { path: "/machineresolver/", respond: () => machineResolvers }
      ])
    );

    renderWithProviders(<MachineResolverListPage />, {
      route: "/config/machineresolvers/list"
    });

    expect(await screen.findByRole("link", { name: "hosts1" })).toHaveAttribute(
      "href",
      "#!/config/machineresolvers/hosts/hosts1"
    );
    expect(screen.getByRole("link", { name: "ldap1" })).toHaveAttribute(
      "href",
      "#!/config/machineresolvers/ldap/ldap1"
    );
    expect(within(rowOf("ldap1")).getByText("ldap")).toBeInTheDocument();
    expect(within(rowOf("hosts1")).getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "#!/config/machineresolvers/hosts/hosts1"
    );
    expect(screen.getByRole("link", { name: "New HOSTS Resolver" })).toHaveAttribute(
      "href",
      "#!/config/machineresolvers/hosts"
    );
    expect(screen.getByRole("link", { name: "New LDAP Resolver" })).toHaveAttribute(
      "href",
      "#!/config/machineresolvers/ldap"
    );
  });

  it("deletes a resolver right away without the confirmation policy", async () => {
    stubSession(allRights);
    const fetchMock = createRouteFetchMock([
      { path: "/machineresolver/", respond: () => machineResolvers },
      { method: "DELETE", path: "/machineresolver/hosts1", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<MachineResolverListPage />, {
      route: "/config/machineresolvers/list"
    });

    await screen.findByRole("link", { name: "hosts1" });
    await user.click(within(rowOf("hosts1")).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        findFetchCalls(fetchMock, "DELETE", "/machineresolver/hosts1")
      ).toHaveLength(1);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks before deleting when the deletion_confirmation policy is set", async () => {
    stubSession(allRights, { deletion_confirmation: true });
    const fetchMock = createRouteFetchMock([
      { path: "/machineresolver/", respond: () => machineResolvers },
      { method: "DELETE", path: "/machineresolver/hosts1", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<MachineResolverListPage />, {
      route: "/config/machineresolvers/list"
    });

    await screen.findByRole("link", { name: "hosts1" });
    await user.click(within(rowOf("hosts1")).getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(
      "Do you really want to delete this machine resolver? (hosts1)"
    );
    expect(findFetchCalls(fetchMock, "DELETE", "/machineresolver/hosts1")).toHaveLength(
      0
    );

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        findFetchCalls(fetchMock, "DELETE", "/machineresolver/hosts1")
      ).toHaveLength(1);
    });
  });

  it("hides the write actions without the rights", async () => {
    stubSession(["mresolverread"]);
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        { path: "/machineresolver/", respond: () => machineResolvers }
      ])
    );

    renderWithProviders(<MachineResolverListPage />, {
      route: "/config/machineresolvers/list"
    });

    await screen.findByRole("link", { name: "hosts1" });
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByText("New Resolvers")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "New HOSTS Resolver" })
    ).not.toBeInTheDocument();
  });
});

function rowOf(resolverName: string): HTMLElement {
  const row = screen.getByRole("link", { name: resolverName }).closest("tr");

  if (!row) {
    throw new Error(`No table row for ${resolverName}`);
  }

  return row;
}

function stubSession(rights: string[], settings: WebUiSettingsPayload = {}): void {
  stubLegacySession(
    {
      auth_token: "legacy-token",
      menus: [],
      realm: "",
      rights,
      role: "admin",
      username: "admin"
    },
    settings
  );
}
