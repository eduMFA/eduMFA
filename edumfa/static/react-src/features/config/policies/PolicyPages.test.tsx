import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/routes";
import type { Policy } from "@/api/policies";
import {
  createRouteFetchMock,
  findFetchCalls,
  getFetchUrl,
  getJsonRequestBody,
  stubSession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import {
  policyConditions,
  policyDefinitions,
  storedPolicy
} from "@/tests/policyFixtures";
import { renderWithProviders } from "@/tests/renderWithProviders";

const allRights = ["policyread", "policywrite", "policydelete", "resolverread"];

describe("policy pages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an admin policy with boolean actions and all its conditions", async () => {
    stubSession({ rights: allRights });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/add");
    const name = await screen.findByLabelText(fieldLabel("Policy Name"));
    expect(screen.getByRole("button", { name: "Save Policy" })).toBeDisabled();
    fireEvent.change(name, { target: { value: "helpdesk" } });
    await user.selectOptions(screen.getByLabelText(fieldLabel("Scope")), "admin");
    await user.click(await screen.findByRole("checkbox", { name: "admins" }));
    await user.click(screen.getByRole("checkbox", { name: "realm1" }));
    await user.click(screen.getByRole("checkbox", { name: "ldap1" }));
    await user.click(screen.getByRole("checkbox", { name: "node1" }));
    fill("Admin", "root, admin");
    fill("User", "alice, !bob");
    fill("Client", "10.0.0.0/8, !10.0.0.124");
    fill("Valid time", "Mon-Fri: 9-18");
    await user.click(
      screen.getByLabelText(
        "Check all possible resolvers of a user to match the resolver in this policy."
      )
    );
    await user.click(screen.getByRole("checkbox", { name: "enable" }));
    await user.click(screen.getByRole("button", { name: "Add a condition" }));
    fill("Key 1", "department");
    fill("Value 1", "IT");
    await user.click(screen.getByRole("checkbox", { name: "Active condition 1" }));
    await user.click(screen.getByRole("button", { name: "Save Policy" }));
    await screen.findByRole("heading", { name: "All Policies" });
    expect(body(fetchMock, "/policy/helpdesk")).toEqual({
      scope: "admin",
      priority: 1,
      active: "true",
      action: { enable: true },
      realm: ["realm1"],
      resolver: ["ldap1"],
      adminrealm: ["admins"],
      adminuser: ["root", "admin"],
      edumfanode: ["node1"],
      user: ["alice", "!bob"],
      client: ["10.0.0.0/8", "!10.0.0.124"],
      time: "Mon-Fri: 9-18",
      check_all_resolvers: true,
      conditions: [["userinfo", "department", "equals", "IT", true]]
    });
  });

  it("preserves unknown actions, missing realm choices and zero values when editing an inactive policy", async () => {
    stubSession({ rights: allRights });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/details/existing");
    expect(await screen.findByLabelText(fieldLabel("Policy Name"))).toHaveValue(
      "existing"
    );
    expect(screen.getByRole("checkbox", { name: "old-realm" })).toBeChecked();
    expect(screen.getByLabelText(fieldLabel("Value for maxfail"))).toHaveValue("0");
    expect(screen.getByRole("checkbox", { name: "hotp" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "totp" })).toBeChecked();
    fill("User", "carol");
    await user.click(screen.getByRole("button", { name: "Save Policy" }));
    await screen.findByRole("heading", { name: "All Policies" });
    expect(body(fetchMock, "/policy/existing")).toMatchObject({
      active: "false",
      action: storedPolicy.action,
      realm: storedPolicy.realm,
      conditions: storedPolicy.conditions,
      user: ["carol"]
    });
  });

  it("edits all action types and retains selected values while filtering", async () => {
    stubSession({ rights: allRights });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/add");
    await screen.findByLabelText(fieldLabel("Policy Name"));
    fill("Policy Name", "typed-actions");
    await user.selectOptions(
      screen.getByLabelText(fieldLabel("Scope")),
      "authentication"
    );
    await user.click(screen.getByRole("checkbox", { name: "maxfail" }));
    expect(screen.getByRole("button", { name: "Save Policy" })).toBeDisabled();
    fill("Value for maxfail", "0");
    await user.click(screen.getByRole("checkbox", { name: "otppin" }));
    await user.selectOptions(
      screen.getByLabelText(fieldLabel("Value for otppin")),
      "userstore"
    );
    await user.click(screen.getByRole("checkbox", { name: "banner" }));
    fill("Value for banner", "Welcome\nPlease authenticate");
    await user.click(screen.getByRole("checkbox", { name: "token_types" }));
    await user.click(screen.getByRole("checkbox", { name: "totp" }));
    fill("Filter actions", "PIN");
    expect(screen.queryByRole("checkbox", { name: "maxfail" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "require_pin" }));
    await user.click(screen.getByRole("button", { name: "Save Policy" }));
    await screen.findByRole("heading", { name: "All Policies" });
    expect(body(fetchMock, "/policy/typed-actions").action).toEqual({
      maxfail: 0,
      otppin: "userstore",
      banner: "Welcome\nPlease authenticate",
      token_types: "totp",
      require_pin: true
    });
  });

  it("clears actions when the scope changes and can remove an additional condition", async () => {
    stubSession({ rights: allRights });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/details/existing");
    await screen.findByLabelText(fieldLabel("Policy Name"));
    await user.selectOptions(screen.getByLabelText(fieldLabel("Scope")), "admin");
    await user.click(screen.getByRole("checkbox", { name: "enable" }));
    await user.click(screen.getByRole("button", { name: "Remove condition 1" }));
    await user.click(screen.getByRole("button", { name: "Save Policy" }));
    await screen.findByRole("heading", { name: "All Policies" });
    expect(body(fetchMock, "/policy/existing")).toMatchObject({
      scope: "admin",
      action: { enable: true },
      conditions: []
    });
  });

  it("renders and saves ungrouped actions after selecting a scope", async () => {
    stubSession({ rights: allRights });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/add");
    await screen.findByLabelText(fieldLabel("Policy Name"));
    fill("Policy Name", "typed-actions");
    const scope = screen.getByLabelText(fieldLabel("Scope"));
    await user.selectOptions(scope, "admin");
    await user.selectOptions(scope, "register");
    expect(screen.getByRole("button", { name: "Miscellaneous" })).toBeInTheDocument();
    for (const name of ["email", "realm", "resolver"]) {
      await user.click(screen.getByRole("checkbox", { name }));
    }
    fill("Value for email", "@example.org");
    await user.selectOptions(
      screen.getByLabelText(fieldLabel("Value for realm")),
      "realm1"
    );
    await user.selectOptions(
      screen.getByLabelText(fieldLabel("Value for resolver")),
      "ldap1"
    );
    await user.click(screen.getByRole("button", { name: "Close all groups" }));
    await waitFor(() => {
      expect(screen.queryByRole("checkbox", { name: "email" })).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Open all groups" }));
    expect(await screen.findByRole("checkbox", { name: "email" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save Policy" }));
    await screen.findByRole("heading", { name: "All Policies" });
    expect(body(fetchMock, "/policy/typed-actions")).toMatchObject({
      scope: "register",
      action: { email: "@example.org", realm: "realm1", resolver: "ldap1" }
    });
  });

  it("loads a template on demand and only persists it after Save", async () => {
    stubSession({ rights: allRights });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/add");
    const button = await screen.findByRole("button", { name: "Show Policy templates" });
    expect(
      fetchMock.mock.calls.some(([input]) =>
        getFetchUrl(input).includes("githubusercontent")
      )
    ).toBe(false);
    await user.click(button);
    await user.click(await screen.findByRole("button", { name: "sample-template" }));
    await waitFor(() => {
      expect(screen.getByLabelText(fieldLabel("Policy Name"))).toHaveValue(
        "from-template"
      );
    });
    expect(findFetchCalls(fetchMock, "POST", "/policy/from-template")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Save Policy" }));
    await screen.findByRole("heading", { name: "All Policies" });
    expect(body(fetchMock, "/policy/from-template")).toMatchObject({
      scope: "admin",
      active: "true",
      priority: 1,
      action: { enable: true },
      realm: []
    });
  });

  it("filters and sorts the list, changes priorities without enabling policies, and confirms deletion", async () => {
    stubSession({ rights: allRights }, { deletion_confirmation: true });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/list");
    await screen.findByRole("link", { name: "existing" });
    expect(
      screen
        .getAllByRole("link", { name: /^(existing|other)$/ })
        .map((link) => link.textContent)
    ).toEqual(["other", "existing"]);
    await user.click(screen.getByRole("button", { name: "Priority" }));
    expect(
      screen
        .getAllByRole("link", { name: /^(existing|other)$/ })
        .map((link) => link.textContent)
    ).toEqual(["existing", "other"]);
    fill("Filter actions", "custom_plugin");
    expect(screen.queryByRole("link", { name: "other" })).not.toBeInTheDocument();
    fill("Filter actions", "");
    fill("Filter policy name", "existing");
    expect(screen.queryByRole("link", { name: "other" })).not.toBeInTheDocument();
    fill("Priority for existing", "2");
    fireEvent.blur(screen.getByLabelText("Priority for existing"));
    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/policy/existing")).toHaveLength(1);
    });
    expect(body(fetchMock, "/policy/existing")).toMatchObject({
      priority: 2,
      active: "false",
      action: storedPolicy.action
    });
    await user.click(
      await screen.findByRole("button", { name: "Enable policy existing" })
    );
    await screen.findByRole("button", { name: "Disable policy existing" });
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(findFetchCalls(fetchMock, "DELETE", "/policy/existing")).toHaveLength(0);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" })
    );
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "existing" })).not.toBeInTheDocument();
    });
  });

  it("shows read-only details without save, toggle or delete actions", async () => {
    stubSession({ rights: ["policyread"] });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    renderPage("/config/policies/details/existing");
    const name = await screen.findByLabelText(fieldLabel("Policy Name"));
    expect(name).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save Policy" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enable" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    const form = name.closest("form");
    if (!form) throw new Error("Missing policy form");
    fireEvent.submit(form);
    expect(findFetchCalls(fetchMock, "POST", "/policy/existing")).toHaveLength(0);
  });

  it("requires policywrite to create a policy", () => {
    stubSession({ rights: ["policyread"] });
    const fetchMock = backend();
    vi.stubGlobal("fetch", fetchMock);
    renderPage("/config/policies/add");
    expect(screen.getByRole("alert")).toHaveTextContent("You do not have permission");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a missing policy instead of an empty edit form", async () => {
    stubSession({ rights: allRights });
    vi.stubGlobal("fetch", backend());
    renderPage("/config/policies/details/missing");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Policy missing was not found."
    );
    expect(screen.queryByLabelText(fieldLabel("Policy Name"))).not.toBeInTheDocument();
  });

  it("keeps edits and shows an API failure when saving is denied", async () => {
    stubSession({ rights: allRights });
    const fetchMock = backend(true);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("/config/policies/details/existing");
    await screen.findByLabelText(fieldLabel("Policy Name"));
    fill("User", "carol");
    await user.click(screen.getByRole("button", { name: "Save Policy" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Policy update denied");
    expect(screen.getByLabelText("User")).toHaveValue("carol");
    expect(
      screen.getByRole("heading", { name: "Edit Policy existing" })
    ).toBeInTheDocument();
  });
});

function renderPage(route: string) {
  return renderWithProviders(<AppRoutes />, { route });
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(fieldLabel(label)), { target: { value } });
}
function body(fetchMock: ReturnType<typeof backend>, path: string) {
  return getJsonRequestBody(findFetchCalls(fetchMock, "POST", path)[0]?.init);
}

function backend(denySave = false) {
  let policies: Policy[] = [
    structuredClone(storedPolicy),
    {
      ...structuredClone(storedPolicy),
      name: "other",
      active: true,
      priority: 1,
      action: { require_pin: true }
    }
  ];
  const routes = createRouteFetchMock([
    { path: "/policy/", respond: () => policies },
    {
      path: "/policy/existing",
      respond: () => policies.filter((policy) => policy.name === "existing")
    },
    { path: "/policy/missing", respond: () => [] },
    { path: "/policy/defs", respond: () => policyDefinitions },
    { path: "/policy/defs/conditions", respond: () => policyConditions },
    { path: "/policy/defs/edumfanodes", respond: () => ["node1", "node2"] },
    {
      path: "/realm/",
      respond: () => ({ realm1: { resolver: [] }, realm2: { resolver: [] } })
    },
    { path: "/realm/superuser", respond: () => ["admins"] },
    {
      path: "/resolver/",
      respond: () => ({
        ldap1: { resolvername: "ldap1", data: {}, type: "ldapresolver" }
      })
    },
    ...["existing", "helpdesk", "typed-actions", "from-template"].map((name) => ({
      method: "POST",
      path: `/policy/${name}`,
      respond: (_url: URL, init: RequestInit | undefined) => {
        const request = getJsonRequestBody(init);
        policies = policies.map((policy) =>
          policy.name === name
            ? { ...policy, ...request, active: request.active === "true" }
            : policy
        );
        return { [`setPolicy ${name}`]: 1 };
      }
    })),
    {
      method: "POST",
      path: "/policy/enable/existing",
      respond: () => {
        policies = policies.map((policy) =>
          policy.name === "existing" ? { ...policy, active: true } : policy
        );
        return 1;
      }
    },
    {
      method: "POST",
      path: "/policy/disable/existing",
      respond: () => {
        policies = policies.map((policy) =>
          policy.name === "existing" ? { ...policy, active: false } : policy
        );
        return 1;
      }
    },
    {
      method: "DELETE",
      path: "/policy/existing",
      respond: () => {
        policies = policies.filter((policy) => policy.name !== "existing");
        return 1;
      }
    }
  ]);
  return vi.fn<typeof fetch>((input, init) => {
    const url = new URL(getFetchUrl(input));
    if (url.origin === "https://raw.githubusercontent.com")
      return Promise.resolve(
        new Response(
          JSON.stringify(
            url.pathname.endsWith("index.json")
              ? { "sample-template": "Sample template" }
              : { name: "from-template", scope: "admin", action: { enable: true } }
          )
        )
      );
    if (denySave && init?.method === "POST")
      return Promise.resolve(
        new Response(
          JSON.stringify({
            result: {
              status: false,
              error: { code: 303, message: "Policy update denied" }
            }
          }),
          { status: 403 }
        )
      );
    return routes(input, init);
  });
}
