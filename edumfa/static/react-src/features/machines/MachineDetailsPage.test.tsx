import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { MachineDetailsPage } from "./MachineDetailsPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

const machine = { hostname: "web1", id: "m1", ip: "10.0.0.1", resolver_name: "hosts1" };

const assignment = {
  application: "ssh",
  id: 7,
  machine_id: "m1",
  options: { user: "root" },
  resolver: "hosts1",
  serial: "SSH0001",
  type: "sshkey"
};

const applications = {
  offline: { options: { count: { required: false, type: "int" } } },
  ssh: {
    options: {
      service_id: { required: false, type: "str", value: ["web", "db"] },
      user: {
        description: "The username on the SSH server.",
        required: true,
        type: "str"
      }
    }
  }
};

describe("MachineDetailsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the machine and its token assignments", async () => {
    stubAdminSession();
    vi.stubGlobal("fetch", createBackendMock());

    renderPage();

    await screen.findByText("web1");
    expect(screen.getByRole("link", { name: "SSH0001" })).toHaveAttribute(
      "href",
      "#!/token/details/SSH0001"
    );
    expect(screen.getByText("root")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hosts1" })).toHaveAttribute(
      "href",
      "#!/machine/list?resolver=hosts1"
    );

    const applicationSelect = screen.getByLabelText(fieldLabel("Application"));
    expect(applicationSelect).toContainHTML('<option value="ssh">ssh</option>');
    expect(applicationSelect).not.toContainHTML("offline");
  });

  it("attaches a token with the application options", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("web1");

    const attachButton = screen.getByRole("button", { name: "Attach Token" });
    await user.type(
      screen.getByRole("combobox", { name: fieldLabel("Serial") }),
      "SSH0002 (sshkey) "
    );
    await user.selectOptions(screen.getByLabelText(fieldLabel("Application")), "ssh");
    expect(attachButton).toBeDisabled();

    await user.type(screen.getByLabelText(fieldLabel("User")), "deploy");
    await user.selectOptions(screen.getByLabelText(fieldLabel("Service_id")), "web");
    await user.click(attachButton);

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/machine/token")).toHaveLength(1);
    });

    const [attachCall] = findFetchCalls(fetchMock, "POST", "/machine/token");
    expect(getJsonRequestBody(attachCall?.init)).toEqual({
      application: "ssh",
      machineid: "m1",
      resolver: "hosts1",
      serial: "SSH0002",
      service_id: "web",
      user: "deploy"
    });
  });

  it("detaches a token by serial, application and assignment id", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("web1");
    await user.click(screen.getByRole("button", { name: "Detach" }));

    await waitFor(() => {
      expect(
        findFetchCalls(fetchMock, "DELETE", "/machine/token/SSH0001/ssh/7")
      ).toHaveLength(1);
    });
  });

  it("saves edited options by assignment id", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("web1");
    await user.click(screen.getByRole("button", { name: "Edit Options" }));

    const userOption = screen.getByLabelText(fieldLabel("User"));
    await user.clear(userOption);
    await user.type(userOption, "admin");
    await user.click(screen.getByRole("button", { name: "Save Options" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/machine/tokenoption")).toHaveLength(1);
    });

    const [saveCall] = findFetchCalls(fetchMock, "POST", "/machine/tokenoption");
    expect(getJsonRequestBody(saveCall?.init)).toEqual({ mtid: 7, user: "admin" });
  });
});

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/machine/details/:id/:resolver" element={<MachineDetailsPage />} />
    </Routes>,
    { route: "/machine/details/m1/hosts1" }
  );
}

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["machinelist", "manage_machine_tokens"],
    role: "admin",
    username: "admin"
  });
}

function createBackendMock() {
  return createRouteFetchMock([
    { path: "/machine/", respond: () => [machine] },
    { path: "/machine/token", respond: () => [assignment] },
    { method: "POST", path: "/machine/token", respond: () => 1 },
    { method: "DELETE", path: "/machine/token/SSH0001/ssh/7", respond: () => 1 },
    { method: "POST", path: "/machine/tokenoption", respond: () => 1 },
    { path: "/application/", respond: () => applications },
    {
      path: "/token/",
      respond: () => ({
        count: 1,
        tokens: [
          {
            description: "",
            realms: ["realm1"],
            serial: "SSH0002",
            tokentype: "sshkey",
            username: "bob"
          }
        ]
      })
    }
  ]);
}
