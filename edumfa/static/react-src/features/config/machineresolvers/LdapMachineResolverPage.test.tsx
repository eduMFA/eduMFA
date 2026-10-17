import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LdapMachineResolverPage } from "./LdapMachineResolverPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

const expectedPayload = {
  AUTHTYPE: "SASL Digest-MD5",
  BINDDN: "cn=admin,dc=example,dc=com",
  BINDPW: "secret",
  HOSTNAMEATTRIBUTE: "dNSHostName",
  IDATTRIBUTE: "DN",
  IPATTRIBUTE: "",
  LDAPBASE: "dc=example,dc=com",
  LDAPURI: "ldaps://ldap.example.com",
  NOREFERRALS: true,
  SEARCHFILTER: "(objectClass=computer)",
  SIZELIMIT: "500",
  START_TLS: true,
  TIMEOUT: "5",
  TLS_CA_FILE: "",
  TLS_VERIFY: true,
  type: "ldap"
};

const storedResolver = {
  ldap1: {
    data: {
      AUTHTYPE: "Simple",
      BINDDN: "cn=admin,dc=example,dc=com",
      BINDPW: "secret",
      HOSTNAMEATTRIBUTE: "dNSHostName",
      IDATTRIBUTE: "DN",
      LDAPBASE: "dc=example,dc=com",
      LDAPURI: "ldap://ldap.example.com",
      NOREFERRALS: "True",
      SEARCHFILTER: "(objectClass=computer)",
      SIZELIMIT: "500",
      START_TLS: "False",
      TIMEOUT: "5",
      TLS_VERIFY: "1"
    },
    resolvername: "ldap1",
    type: "ldap"
  }
};

describe("LdapMachineResolverPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tests and saves a new resolver with the legacy keys", async () => {
    stubSession(["mresolverwrite"]);
    const fetchMock = createRouteFetchMock([
      {
        detail: () => ({
          description: "Your LDAP config seems to be OK, 2 machines found."
        }),
        method: "POST",
        path: "/machineresolver/test",
        respond: () => true
      },
      { method: "POST", path: "/machineresolver/ldap1", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage("/config/machineresolvers/ldap");

    expect(
      screen.getByRole("heading", { name: "Create a new LDAP Machine Resolver" })
    ).toBeInTheDocument();
    const testButton = screen.getByRole("button", { name: "Test LDAP Resolver" });
    expect(testButton).toBeDisabled();
    // The presets of the legacy controller.
    expect(screen.queryByLabelText("STARTTLS")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Bind Type")).toHaveValue("Simple");

    await user.type(screen.getByLabelText(fieldLabel("Resolver name")), "ldap1");
    await user.type(
      screen.getByLabelText(fieldLabel("Server URI")),
      "ldap://ldap.example.com"
    );
    expect(screen.getByLabelText("STARTTLS")).toBeChecked();
    await user.clear(screen.getByLabelText(fieldLabel("Server URI")));
    await user.type(
      screen.getByLabelText(fieldLabel("Server URI")),
      "ldaps://ldap.example.com"
    );
    // An ldaps URI hides STARTTLS and offers the TLS verification instead.
    expect(screen.queryByLabelText("STARTTLS")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Verify TLS")).toBeChecked();
    expect(
      screen.getByLabelText(
        "The file containing the CA certificate which signed the LDAP TLS certificate."
      )
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(fieldLabel("Base DN")), "dc=example,dc=com");
    await user.type(screen.getByLabelText("Bind DN"), "cn=admin,dc=example,dc=com");
    await user.type(screen.getByLabelText("Bind Password"), "secret");
    await user.selectOptions(screen.getByLabelText("Bind Type"), "SASL Digest-MD5");
    await user.type(screen.getByLabelText(fieldLabel("Timeout (seconds)")), "5");
    await user.type(screen.getByLabelText(fieldLabel("Size Limit")), "500");
    await user.click(screen.getByRole("button", { name: "Preset Active Directory" }));

    expect(screen.getByLabelText(fieldLabel("Search Filter"))).toHaveValue(
      "(objectClass=computer)"
    );
    expect(screen.getByLabelText(fieldLabel("Machine ID Attribute"))).toHaveValue("DN");
    expect(screen.getByLabelText(fieldLabel("Hostname Attribute"))).toHaveValue(
      "dNSHostName"
    );
    expect(screen.getByLabelText("No anonymous referral chasing")).toBeChecked();

    await waitFor(() => {
      expect(testButton).toBeEnabled();
    });
    await user.click(testButton);

    expect(
      await screen.findByText("Your LDAP config seems to be OK, 2 machines found.")
    ).toBeInTheDocument();
    const [testCall] = findFetchCalls(fetchMock, "POST", "/machineresolver/test");
    expect(getJsonRequestBody(testCall?.init)).toEqual(expectedPayload);

    await user.click(screen.getByRole("button", { name: "Save resolver" }));

    await screen.findByText("list page");
    const [saveCall] = findFetchCalls(fetchMock, "POST", "/machineresolver/ldap1");
    expect(getJsonRequestBody(saveCall?.init)).toEqual(expectedPayload);
  });

  it("loads a stored resolver and normalises the flag strings", async () => {
    stubSession(["mresolverread"]);
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        { path: "/machineresolver/ldap1", respond: () => storedResolver }
      ])
    );
    const user = userEvent.setup();

    renderPage("/config/machineresolvers/ldap/ldap1");

    expect(
      await screen.findByRole("heading", { name: "Edit LDAP Machine Resolver ldap1" })
    ).toBeInTheDocument();
    expect(await screen.findByLabelText(fieldLabel("Server URI"))).toHaveValue(
      "ldap://ldap.example.com"
    );
    expect(screen.getByLabelText("STARTTLS")).not.toBeChecked();
    expect(screen.getByLabelText("No anonymous referral chasing")).toBeChecked();
    expect(screen.getByLabelText("Bind Password")).toHaveValue("secret");
    // Plain ldap without STARTTLS: no TLS verification offered.
    expect(screen.queryByLabelText("Verify TLS")).not.toBeInTheDocument();
    // Without mresolverwrite the test stays available but nothing can be saved.
    expect(
      screen.queryByRole("button", { name: "Save resolver" })
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Test LDAP Resolver" })).toBeEnabled();
    });

    await user.click(screen.getByLabelText("STARTTLS"));

    expect(screen.getByLabelText("Verify TLS")).toBeChecked();
  });
});

function renderPage(route: string): void {
  renderWithProviders(
    <Routes>
      <Route
        element={<LdapMachineResolverPage />}
        path="/config/machineresolvers/ldap"
      />
      <Route
        element={<LdapMachineResolverPage />}
        path="/config/machineresolvers/ldap/:resolvername"
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
