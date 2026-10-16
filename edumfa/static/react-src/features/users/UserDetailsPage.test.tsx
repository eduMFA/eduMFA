import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { UserDetailsPage } from "./UserDetailsPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "../../tests/fetchMockUtils";
import { renderWithProviders } from "../../tests/renderWithProviders";

const alice = {
  editable: true,
  email: "alice@example.com",
  givenname: "Alice",
  resolver: "sqlres",
  surname: "Cooper",
  userid: "1001",
  username: "alice"
};

const sqlResolver = {
  sqlres: {
    data: {
      Map: JSON.stringify({
        email: "email",
        givenname: "givenname",
        password: "password",
        surname: "surname",
        userid: "id",
        username: "username"
      })
    },
    resolvername: "sqlres",
    type: "sqlresolver"
  }
};

const hotpToken = {
  active: true,
  count_window: 10,
  description: "desk token",
  failcount: 0,
  maxfail: 10,
  otplen: 6,
  realms: ["realm1"],
  serial: "HOTP0001",
  tokentype: "hotp",
  username: "alice"
};

describe("UserDetailsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the resolver attributes, tokens and cross links", async () => {
    stubAdminSession();
    vi.stubGlobal("fetch", createBackendMock());

    renderPage();

    await screen.findByText("Cooper");

    expect(screen.getByRole("link", { name: "HOTP0001" })).toHaveAttribute(
      "href",
      "#!/token/details/HOTP0001"
    );
    expect(screen.getByRole("link", { name: "Enroll New Token" })).toHaveAttribute(
      "href",
      "#!/token/enroll/realm1/alice"
    );
    expect(
      screen.getByRole("link", { name: "View user in Audit log" })
    ).toHaveAttribute("href", "#!/audit/log?user=alice");
    expect(screen.getByText("IT")).toBeInTheDocument();
  });

  it("updates the user through PUT /user/ with the user id", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Cooper");
    await user.click(screen.getByRole("button", { name: "Edit user" }));

    const surnameInput = screen.getByLabelText("surname");
    await user.clear(surnameInput);
    await user.type(surnameInput, "Cooper-Smith");
    await user.click(screen.getByRole("button", { name: "Save user" }));

    await screen.findByText("User updated successfully.");

    const [updateCall] = findFetchCalls(fetchMock, "PUT", "/user/");
    expect(updateCall).toBeDefined();
    expect(getJsonRequestBody(updateCall?.init)).toMatchObject({
      resolver: "sqlres",
      surname: "Cooper-Smith",
      user: "alice",
      userid: "1001"
    });
  });

  it("deletes the user after confirmation and returns to the list", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Cooper");
    await user.click(screen.getByRole("button", { name: "Delete user" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete User" }));

    await screen.findByText("list page");
    expect(findFetchCalls(fetchMock, "DELETE", "/user/sqlres/alice")).toHaveLength(1);
  });

  it("assigns a token with the serial stripped from the suggestion", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Cooper");
    await user.type(screen.getByLabelText("Serial"), "HOTP0002 (hotp) ");
    await user.type(screen.getByLabelText("PIN/Password"), "1234");
    await user.type(screen.getByLabelText("Repeat PIN or password"), "1234");
    await user.click(screen.getByRole("button", { name: "Assign Token" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/token/assign")).toHaveLength(1);
    });

    const [assignCall] = findFetchCalls(fetchMock, "POST", "/token/assign");
    expect(getJsonRequestBody(assignCall?.init)).toEqual({
      pin: "1234",
      realm: "realm1",
      serial: "HOTP0002",
      user: "alice"
    });
  });
});

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/user/details/:realm/:user" element={<UserDetailsPage />} />
      <Route path="/user/list" element={<div>list page</div>} />
    </Routes>,
    { route: "/user/details/realm1/alice" }
  );
}

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["userlist", "updateuser", "deleteuser", "assign", "enrollHOTP"],
    role: "admin",
    username: "admin"
  });
}

function createBackendMock() {
  return createRouteFetchMock([
    { path: "/user/", respond: () => [alice] },
    { method: "PUT", path: "/user/", respond: () => true },
    { method: "DELETE", path: "/user/sqlres/alice", respond: () => true },
    { path: "/resolver/sqlres", respond: () => sqlResolver },
    {
      path: "/user/editable_attributes/",
      respond: () => ({ delete: ["*"], set: { department: ["*"] } })
    },
    { path: "/user/attribute", respond: () => ({ department: "IT" }) },
    {
      path: "/token/",
      respond: (url) =>
        url.searchParams.has("serial")
          ? { count: 0, tokens: [] }
          : { count: 1, current: 1, next: null, prev: null, tokens: [hotpToken] }
    },
    { method: "POST", path: "/token/assign", respond: () => true }
  ]);
}
