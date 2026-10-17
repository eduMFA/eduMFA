import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolverConfigRoutes } from "./routes";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubSession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

const ldap = {
  LDAPURI: "ldap://directory.example.org",
  LDAPBASE: "dc=example,dc=org",
  BINDDN: "cn=admin,dc=example,dc=org",
  BINDPW: "__CENSORED__",
  AUTHTYPE: "Simple",
  TIMEOUT: "5",
  CACHE_TIMEOUT: "120",
  SIZELIMIT: "500",
  LOGINNAMEATTRIBUTE: "uid",
  LDAPSEARCHFILTER: "(uid=*)",
  USERINFO: '{"email":"mail"}',
  UIDTYPE: "entryUUID",
  START_TLS: "True",
  TLS_VERIFY: "1",
  SERVERPOOL_PERSISTENT: "true",
  CUSTOM_SETTING: "keep me"
};

describe("resolver editors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an LDAP resolver using defaults and an Active Directory preset", async () => {
    stubSession({ rights: ["resolverwrite"] });
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/resolver/directory", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("ldap");

    expect(screen.getByRole("button", { name: "Save resolver" })).toBeDisabled();
    fill("Resolver name", "directory");
    fill("Server URI", "ldaps://directory.example.org");
    fill("Base DN", "dc=example,dc=org");
    await user.click(screen.getByRole("button", { name: "Preset Active Directory" }));
    expect(screen.getByLabelText("Verify TLS")).toBeChecked();
    expect(screen.getByLabelText(fieldLabel("UID Type"))).toHaveValue("objectGUID");
    await user.click(screen.getByRole("button", { name: "Save resolver" }));

    await screen.findByText("Resolver list destination");
    expect(body(fetchMock, "/resolver/directory")).toMatchObject({
      type: "ldapresolver",
      LDAPURI: "ldaps://directory.example.org",
      SIZELIMIT: "500",
      TIMEOUT: "5",
      CACHE_TIMEOUT: "120",
      TLS_VERIFY: true,
      TLS_VERSION: "2",
      LOGINNAMEATTRIBUTE: "sAMAccountName",
      LDAPSEARCHFILTER: "(sAMAccountName=*)(objectCategory=person)",
      UIDTYPE: "objectGUID",
      NOREFERRALS: true
    });
  });

  it("tests stored LDAP secrets and anonymous binds without changing the saved size limit", async () => {
    stubSession({ rights: ["resolverread", "resolverwrite"] });
    const fetchMock = createRouteFetchMock([
      {
        path: "/resolver/directory",
        respond: () => ({
          directory: { data: ldap, resolvername: "directory", type: "ldapresolver" }
        })
      },
      {
        method: "POST",
        path: "/resolver/test",
        respond: () => true,
        detail: () => ({ description: "Directory connection successful" })
      },
      { method: "POST", path: "/resolver/directory", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("ldap/directory");

    expect(await screen.findByLabelText("Bind Password")).toHaveValue("__CENSORED__");
    expect(screen.getByLabelText("Per-process server pool")).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Quick Resolver Test" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Directory connection successful"
    );
    expect(body(fetchMock, "/resolver/test")).toMatchObject({
      resolver: "directory",
      BINDPW: "__CENSORED__",
      SIZELIMIT: 1
    });

    await user.selectOptions(screen.getByLabelText("Bind Type"), "Anonymous");
    expect(screen.queryByLabelText("Bind Password")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Test LDAP Resolver" }));
    await screen.findByRole("status");
    expect(body(fetchMock, "/resolver/test", 1)).toMatchObject({
      resolver: "directory",
      AUTHTYPE: "Simple",
      BINDPW: "",
      BINDDN: "",
      SIZELIMIT: 0
    });

    await user.click(screen.getByRole("button", { name: "Save resolver" }));
    await screen.findByText("Resolver list destination");
    expect(body(fetchMock, "/resolver/directory")).toMatchObject({
      AUTHTYPE: "Anonymous",
      SIZELIMIT: "500",
      BINDPW: "__CENSORED__",
      CUSTOM_SETTING: "keep me"
    });
    expect(body(fetchMock, "/resolver/directory")).not.toHaveProperty("resolver");
  });

  it("tests SQL with a zero-user success result and saves the chosen mapping", async () => {
    stubSession({ rights: ["resolverwrite"] });
    const fetchMock = createRouteFetchMock([
      {
        method: "POST",
        path: "/resolver/test",
        respond: () => 0,
        detail: () => ({ description: "Connected, found 0 users" })
      },
      { method: "POST", path: "/resolver/sql1", respond: () => 2 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("sql");
    fill("Resolver name", "sql1");
    fill("Driver", "mysql+pymysql");
    fill("Server", "127.0.0.1");
    fill("Limit", "500");
    await user.click(screen.getByRole("button", { name: "Wordpress" }));
    await user.click(screen.getByLabelText("Edit user store"));
    await user.selectOptions(
      screen.getByLabelText("Password Hash for editable users"),
      "PHPASS"
    );
    await user.click(screen.getByRole("button", { name: "Test SQL Resolver" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Connected, found 0 users"
    );
    await user.click(screen.getByRole("button", { name: "Save resolver" }));
    await screen.findByText("Resolver list destination");
    const payload = body(fetchMock, "/resolver/sql1");
    expect(payload).toMatchObject({
      type: "sqlresolver",
      Table: "wp_users",
      Editable: true,
      Password_Hash_Type: "PHPASS"
    });
    expect(JSON.parse(String(payload.Map))).toMatchObject({
      userid: "ID",
      username: "user_login",
      password: "user_pass"
    });
  });

  it("keeps the original SCIM resolver name when testing censored credentials after a rename", async () => {
    stubSession({ rights: ["resolverwrite"] });
    const fetchMock = createRouteFetchMock([
      {
        path: "/resolver/scim1",
        respond: () => ({
          scim1: {
            data: {
              Authserver: "https://auth.example.org",
              Resourceserver: "https://users.example.org",
              Client: "client",
              Secret: "__CENSORED__"
            },
            resolvername: "scim1",
            type: "scimresolver"
          }
        })
      },
      {
        method: "POST",
        path: "/resolver/test",
        respond: () => false,
        detail: () => ({ description: "Connection rejected" })
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("scim/scim1");
    expect(await screen.findByLabelText(fieldLabel("Secret"))).toHaveAttribute(
      "type",
      "password"
    );
    fill("Resolver name", "renamed");
    await user.click(screen.getByRole("button", { name: "Test SCIM Resolver" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Connection rejected");
    expect(body(fetchMock, "/resolver/test")).toMatchObject({
      type: "scimresolver",
      resolver: "scim1",
      Secret: "__CENSORED__"
    });
  });

  it("validates HTTP JSON and only requires an error response when handling is enabled", async () => {
    stubSession({ rights: ["resolverwrite"] });
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/resolver/http1", respond: () => 3 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("httpresolver");
    fill("Resolver name", "http1");
    fill("Endpoint (URL)", "https://users.example.org");
    await user.selectOptions(screen.getByLabelText(fieldLabel("Method")), "post");
    fill("Request Mapping (JSON format)", '{"customerid":"{userid}"}');
    fill("Headers (JSON format)", "invalid");
    fill("Response Mapping (JSON format)", '{"username":"{Username}"}');
    const save = screen.getByRole("button", { name: "Save resolver" });
    expect(save).toBeDisabled();
    expect(screen.getByText("Enter a valid JSON object.")).toBeInTheDocument();
    fill("Headers (JSON format)", "{}");
    await user.click(screen.getByLabelText("Special Error Handling"));
    expect(save).toBeDisabled();
    await user.click(screen.getByLabelText("Special Error Handling"));
    await user.click(save);
    await screen.findByText("Resolver list destination");
    expect(body(fetchMock, "/resolver/http1")).toMatchObject({
      type: "httpresolver",
      method: "post",
      hasSpecialErrorHandler: false,
      errorResponse: "{}"
    });
  });

  it.each(["ldap", "sql", "scim", "httpresolver", "passwd"])(
    "prevents saving %s without resolverwrite, including form submission",
    (type) => {
      stubSession({ rights: ["resolverread"] });
      const fetchMock = createRouteFetchMock([]);
      vi.stubGlobal("fetch", fetchMock);
      renderPage(type);
      fill("Resolver name", "readonly");
      expect(
        screen.queryByRole("button", { name: "Save resolver" })
      ).not.toBeInTheDocument();
      const form = screen.getByLabelText(fieldLabel("Resolver name")).closest("form");
      if (!form) throw new Error("Missing resolver form");
      fireEvent.submit(form);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("shows missing resolvers without exposing an empty edit form", async () => {
    stubSession({ rights: ["resolverread", "resolverwrite"] });
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([{ path: "/resolver/missing", respond: () => ({}) }])
    );
    renderPage("sql/missing");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Resolver missing not found."
    );
    expect(
      screen.queryByLabelText(fieldLabel("Resolver name"))
    ).not.toBeInTheDocument();
  });

  it("lists resolvers with the right edit URLs and confirms deletions", async () => {
    stubSession(
      { rights: ["resolverread", "resolverdelete"] },
      { deletion_confirmation: true }
    );
    const fetchMock = createRouteFetchMock([
      {
        path: "/resolver/",
        respond: () => ({
          sql1: { resolvername: "sql1", type: "sqlresolver", data: {} }
        })
      },
      { method: "DELETE", path: "/resolver/sql1", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        {resolverConfigRoutes.map((route) => (
          <Route
            key={route.path}
            path={`/config/${route.path}`}
            element={route.element}
          />
        ))}
      </Routes>,
      { route: "/config/resolvers/list" }
    );
    expect(await screen.findByRole("link", { name: "sql1" })).toHaveAttribute(
      "href",
      "#!/config/resolvers/sql/sql1"
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(findFetchCalls(fetchMock, "DELETE", "/resolver/sql1")).toHaveLength(0);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" })
    );
    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "DELETE", "/resolver/sql1")).toHaveLength(1);
    });
  });
});

function renderPage(path: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/config/resolvers/list"
        element={<div>Resolver list destination</div>}
      />
      {resolverConfigRoutes
        .filter((route) => route.path !== "resolvers/list")
        .map((route) => (
          <Route
            key={route.path}
            path={`/config/${route.path}`}
            element={route.element}
          />
        ))}
    </Routes>,
    { route: `/config/resolvers/${path}` }
  );
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(fieldLabel(label)), { target: { value } });
}

function body(
  fetchMock: ReturnType<typeof createRouteFetchMock>,
  path: string,
  index = 0
) {
  return getJsonRequestBody(findFetchCalls(fetchMock, "POST", path)[index]?.init);
}
