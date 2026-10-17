import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HostsMachineResolverPage } from "./HostsMachineResolverPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

const storedResolver = {
  hosts1: {
    data: { extra: "kept", filename: "/srv/hosts" },
    resolvername: "hosts1",
    type: "hosts"
  }
};

describe("HostsMachineResolverPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a resolver with the legacy payload and returns to the list", async () => {
    stubSession(["mresolverwrite"]);
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/machineresolver/hosts1", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("/config/machineresolvers/hosts");

    expect(
      screen.getByRole("heading", { name: "Create a new hosts Machine Resolver" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(fieldLabel("File name"))).toHaveValue("/etc/hosts");
    const saveButton = screen.getByRole("button", { name: "Save resolver" });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText(fieldLabel("Resolver name")), "hosts1");
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    await user.click(saveButton);

    await screen.findByText("list page");
    const [saveCall] = findFetchCalls(fetchMock, "POST", "/machineresolver/hosts1");
    expect(getJsonRequestBody(saveCall?.init)).toEqual({
      filename: "/etc/hosts",
      type: "hosts"
    });
  });

  it("rejects the reserved name test", async () => {
    stubSession(["mresolverwrite"]);
    vi.stubGlobal("fetch", createRouteFetchMock([]));
    const user = userEvent.setup();

    renderPage("/config/machineresolvers/hosts");

    await user.type(screen.getByLabelText(fieldLabel("Resolver name")), "test");

    expect(
      await screen.findByText(
        "The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'test'"
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save resolver" })).toBeDisabled();
  });

  it("loads an existing resolver and keeps its stored keys on save", async () => {
    stubSession(["mresolverread", "mresolverwrite"]);
    const fetchMock = createRouteFetchMock([
      { path: "/machineresolver/hosts1", respond: () => storedResolver },
      { method: "POST", path: "/machineresolver/hosts1", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("/config/machineresolvers/hosts/hosts1");

    expect(
      await screen.findByRole("heading", { name: "Edit hosts Machine Resolver hosts1" })
    ).toBeInTheDocument();
    const fileInput = await screen.findByLabelText(fieldLabel("File name"));
    expect(fileInput).toHaveValue("/srv/hosts");
    expect(screen.getByLabelText(fieldLabel("Resolver name"))).toHaveValue("hosts1");

    await user.clear(fileInput);
    await user.type(fileInput, "/etc/hosts.new");
    await user.click(screen.getByRole("button", { name: "Save resolver" }));

    await screen.findByText("list page");
    const [saveCall] = findFetchCalls(fetchMock, "POST", "/machineresolver/hosts1");
    expect(getJsonRequestBody(saveCall?.init)).toEqual({
      extra: "kept",
      filename: "/etc/hosts.new",
      type: "hosts"
    });
  });

  it("offers no save button without the mresolverwrite right", async () => {
    stubSession(["mresolverread"]);
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        { path: "/machineresolver/hosts1", respond: () => storedResolver }
      ])
    );

    renderPage("/config/machineresolvers/hosts/hosts1");

    expect(await screen.findByLabelText(fieldLabel("File name"))).toHaveValue(
      "/srv/hosts"
    );
    expect(
      screen.queryByRole("button", { name: "Save resolver" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "New HOSTS Resolver" })
    ).not.toBeInTheDocument();
  });
});

function renderPage(route: string): void {
  renderWithProviders(
    <Routes>
      <Route
        element={<HostsMachineResolverPage />}
        path="/config/machineresolvers/hosts"
      />
      <Route
        element={<HostsMachineResolverPage />}
        path="/config/machineresolvers/hosts/:resolvername"
      />
      <Route element={<div>list page</div>} path="/config/machineresolvers/list" />
    </Routes>,
    { route }
  );
}

function stubSession(rights: string[]): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights,
    role: "admin",
    username: "admin"
  });
}
