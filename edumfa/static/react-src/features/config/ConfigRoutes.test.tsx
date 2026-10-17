import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/routes";
import { createRouteFetchMock, stubSession } from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

describe("configuration routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["/config", "System Config", "/system/", {}],
    ["/config/resolvers/ldap", "Create a new LDAP Resolver", "", {}],
    ["/config/resolvers/sql", "Create a new SQL Resolver", "", {}],
    ["/config/tokens/hotp", "HOTP Token Settings", "/system/", {}],
    ["/config/realms/list", "Realms", "/realm/", {}],
    ["/config/events/list", "Event Handlers", "/event/", []],
    ["/config/periodictasks/list", "Periodic Tasks", "/periodictask/", []],
    ["/config/machineresolvers/hosts", "Create a new hosts Machine Resolver", "", {}]
  ])(
    "renders %s through the application router",
    async (route, title, endpoint, value) => {
      stubSession({
        rights: [
          "configread",
          "resolverread",
          "resolverwrite",
          "mresolverwrite",
          "eventhandling_read",
          "periodictask_read"
        ]
      });
      vi.stubGlobal(
        "fetch",
        createRouteFetchMock([
          ...(endpoint ? [{ path: endpoint, respond: () => value }] : []),
          { path: "/resolver/", respond: () => ({}) },
          { path: "/realm/superuser", respond: () => [] },
          { path: "/system/nodes", respond: () => [] }
        ])
      );
      renderWithProviders(<AppRoutes />, { route });
      expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
      expect(
        screen.queryByText("The configuration pages are not available in this build.")
      ).not.toBeInTheDocument();
    }
  );

  it("explains unfinished config routes rather than redirecting to system settings", () => {
    stubSession({ rights: ["eventhandling_read"] });
    renderWithProviders(<AppRoutes />, { route: "/config/unknown" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This configuration page is not available yet."
    );
  });

  it("requires a session for a configuration deep link", async () => {
    renderWithProviders(<AppRoutes />, { route: "/config/resolvers/ldap" });
    expect(
      await screen.findByRole("heading", { name: "Please sign in" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Create a new LDAP Resolver" })
    ).not.toBeInTheDocument();
  });
});
