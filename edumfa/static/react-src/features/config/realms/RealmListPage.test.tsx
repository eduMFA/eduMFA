import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RealmListPage } from "./RealmListPage";
import type { WebUiSettingsPayload } from "@/auth/session";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession,
  type FetchRoute
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

const realms = {
  realm1: {
    default: true,
    id: 1,
    option: "",
    resolver: [
      { name: "ldap1", node: "", priority: 1, type: "ldapresolver" },
      { name: "passwd1", node: "", priority: null, type: "passwdresolver" }
    ]
  },
  realm2: {
    default: false,
    id: 2,
    option: "",
    resolver: [{ name: "sql1", node: "", priority: 2, type: "sqlresolver" }]
  }
};

const resolvers = {
  ldap1: { data: {}, resolvername: "ldap1", type: "ldapresolver" },
  passwd1: { data: {}, resolvername: "passwd1", type: "passwdresolver" },
  sql1: { data: {}, resolvername: "sql1", type: "sqlresolver" }
};

const allRights = ["resolverread", "resolverwrite", "resolverdelete"];

describe("RealmListPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the realms with their resolvers and the default marker", async () => {
    stubSession(allRights);
    vi.stubGlobal("fetch", createBackendMock());

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    const realm1 = await rowOf("realm1");
    expect(within(realm1).getByRole("link", { name: "ldap1" })).toHaveAttribute(
      "href",
      "#!/config/resolvers/ldap/ldap1"
    );
    expect(realm1).toHaveTextContent("ldap1 [1] (ldapresolver)");
    expect(realm1).toHaveTextContent("passwd1 [] (passwdresolver)");
    expect(within(realm1).getByText("Default")).toBeInTheDocument();
    expect(
      within(realm1).queryByRole("button", { name: "set Default" })
    ).not.toBeInTheDocument();

    const realm2 = await rowOf("realm2");
    expect(within(realm2).getByRole("link", { name: "sql1" })).toHaveAttribute(
      "href",
      "#!/config/resolvers/sql/sql1"
    );
    expect(
      within(realm2).getByRole("button", { name: "set Default" })
    ).toBeInTheDocument();
  });

  it("creates a realm with the selected resolvers and priorities", async () => {
    stubSession(allRights);
    const fetchMock = createBackendMock([
      {
        method: "POST",
        path: "/realm/newrealm",
        respond: () => ({ added: ["ldap1", "sql1"], failed: [] })
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    await rowOf("realm1");
    const createCard = cardOf("New realm");
    const createButton = within(createCard).getByRole("button", {
      name: "Create realm"
    });
    expect(createButton).toBeDisabled();

    await user.type(
      within(createCard).getByLabelText(fieldLabel("Realm name")),
      "newrealm"
    );
    await user.click(within(createCard).getByLabelText("ldap1 (ldapresolver)"));
    await user.type(within(createCard).getByLabelText("Priority of ldap1"), "1");
    await user.click(within(createCard).getByLabelText("sql1 (sqlresolver)"));
    expect(createButton).toBeEnabled();

    await user.click(createButton);

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/realm/newrealm")).toHaveLength(1);
    });
    const [createCall] = findFetchCalls(fetchMock, "POST", "/realm/newrealm");
    expect(getJsonRequestBody(createCall?.init)).toEqual({
      "priority.ldap1": 1,
      resolvers: "ldap1,sql1"
    });
    await waitFor(() => {
      expect(
        within(cardOf("New realm")).getByLabelText(fieldLabel("Realm name"))
      ).toHaveValue("");
    });
  });

  it("flags an invalid realm name", async () => {
    stubSession(allRights);
    vi.stubGlobal("fetch", createBackendMock());
    const user = userEvent.setup();

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    await rowOf("realm1");
    await user.type(screen.getByLabelText(fieldLabel("Realm name")), "bad realm");

    expect(
      screen.getByText(
        "The resource name must consist of letters, numbers and '_', '-', '.'"
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create realm" })).toBeDisabled();
  });

  it("edits the resolvers of a realm", async () => {
    stubSession(allRights);
    const fetchMock = createBackendMock([
      {
        method: "POST",
        path: "/realm/realm1",
        respond: () => ({ added: ["ldap1"], failed: [] })
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    await user.click(
      within(await rowOf("realm1")).getByRole("button", { name: "Edit" })
    );

    const realm1 = await rowOf("realm1");
    expect(within(realm1).getByLabelText("ldap1 (ldapresolver)")).toBeChecked();
    expect(within(realm1).getByLabelText("Priority of ldap1")).toHaveValue("1");
    expect(within(realm1).getByLabelText("passwd1 (passwdresolver)")).toBeChecked();
    expect(within(realm1).getByLabelText("sql1 (sqlresolver)")).not.toBeChecked();
    // The create form and the other rows' actions disappear while editing.
    expect(
      screen.queryByRole("heading", { name: "New realm" })
    ).not.toBeInTheDocument();
    expect(
      within(await rowOf("realm2")).queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();

    await user.click(within(realm1).getByLabelText("passwd1 (passwdresolver)"));
    await user.click(within(realm1).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/realm/realm1")).toHaveLength(1);
    });
    const [saveCall] = findFetchCalls(fetchMock, "POST", "/realm/realm1");
    expect(getJsonRequestBody(saveCall?.init)).toEqual({
      "priority.ldap1": 1,
      resolvers: "ldap1"
    });
    expect(
      await screen.findByRole("heading", { name: "New realm" })
    ).toBeInTheDocument();
  });

  it("sets and clears the default realm", async () => {
    stubSession(allRights);
    const fetchMock = createBackendMock([
      { method: "POST", path: "/defaultrealm/realm2", respond: () => true },
      { method: "DELETE", path: "/defaultrealm", respond: () => true }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    await user.click(
      within(await rowOf("realm2")).getByRole("button", { name: "set Default" })
    );
    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/defaultrealm/realm2")).toHaveLength(1);
    });

    await user.click(screen.getByRole("button", { name: "Clear default realm" }));
    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "DELETE", "/defaultrealm")).toHaveLength(1);
    });
  });

  it("asks before deleting when the deletion_confirmation policy is set", async () => {
    stubSession(allRights, { deletion_confirmation: true });
    const fetchMock = createBackendMock([
      { method: "DELETE", path: "/realm/realm2", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    await user.click(
      within(await rowOf("realm2")).getByRole("button", { name: "Delete" })
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(
      "Do you really want to delete this object? (realm2)"
    );
    expect(findFetchCalls(fetchMock, "DELETE", "/realm/realm2")).toHaveLength(0);

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "DELETE", "/realm/realm2")).toHaveLength(1);
    });
  });

  it("deletes right away without the confirmation policy", async () => {
    stubSession(allRights);
    const fetchMock = createBackendMock([
      { method: "DELETE", path: "/realm/realm2", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    await user.click(
      within(await rowOf("realm2")).getByRole("button", { name: "Delete" })
    );

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "DELETE", "/realm/realm2")).toHaveLength(1);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides the write actions without the rights", async () => {
    stubSession(["resolverread"]);
    vi.stubGlobal("fetch", createBackendMock());

    renderWithProviders(<RealmListPage />, { route: "/config/realms/list" });

    await rowOf("realm2");
    expect(
      screen.queryByRole("button", { name: "set Default" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create realm" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear default realm" })
    ).not.toBeInTheDocument();
  });
});

function createBackendMock(extraRoutes: FetchRoute[] = []) {
  return createRouteFetchMock([
    { path: "/realm/", respond: () => realms },
    { path: "/resolver/", respond: () => resolvers },
    ...extraRoutes
  ]);
}

async function rowOf(realmName: string): Promise<HTMLElement> {
  const row = (await screen.findByText(realmName)).closest("tr");

  if (!row) {
    throw new Error(`No table row for ${realmName}`);
  }

  return row;
}

function cardOf(title: string): HTMLElement {
  const card = screen.getByRole("heading", { name: title }).closest("section");

  if (!card) {
    throw new Error(`No card titled ${title}`);
  }

  return card;
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
