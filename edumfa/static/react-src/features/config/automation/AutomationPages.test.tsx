import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/routes";
import {
  createRouteFetchMock,
  findFetchCalls,
  getFetchUrl,
  getJsonRequestBody,
  stubSession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";
import {
  storedEvent,
  storedTask,
  eventActions,
  eventConditions,
  taskOptions
} from "@/tests/automationFixtures";

const rights = [
  "eventhandling_read",
  "eventhandling_write",
  "periodictask_read",
  "periodictask_write"
];
const renderPage = (route: string) => renderWithProviders(<AppRoutes />, { route });
const fill = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(fieldLabel(name)), { target: { value } });
const body = (mock: ReturnType<typeof backend>, path: string) => {
  const call = findFetchCalls(mock, "POST", path).at(-1);
  if (!call) throw new Error(`Missing POST ${path}`);
  return getJsonRequestBody(call.init);
};

describe("event handlers and periodic tasks", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates an event with typed options and grouped multi-value conditions", async () => {
    stubSession({ rights });
    const fetch = backend();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderPage("/config/events/add");
    fill("Description", "New notification");
    await user.click(await screen.findByRole("checkbox", { name: "token_init" }));
    await user.selectOptions(
      screen.getByLabelText(fieldLabel("Handlermodule")),
      "UserNotification"
    );
    await user.selectOptions(
      await screen.findByLabelText(fieldLabel("Position")),
      "post"
    );
    await user.selectOptions(screen.getByLabelText(fieldLabel("Action")), "sendmail");
    await user.selectOptions(screen.getByLabelText(fieldLabel("recipient")), "user");
    expect(screen.queryByLabelText(fieldLabel("email"))).not.toBeInTheDocument();
    fill("body", "Hello\nWelcome");
    fill("count", "0");
    await user.click(screen.getByRole("checkbox", { name: "enabled" }));
    await user.click(screen.getByRole("checkbox", { name: "realm" }));
    await user.click(screen.getByRole("checkbox", { name: "realm2" }));
    await user.click(screen.getByRole("checkbox", { name: "serial" }));
    fill("Value for serial", "^OATH");
    await user.click(
      screen.getByRole("button", { name: "Save Event Handler Definition" })
    );
    await screen.findByRole("heading", { name: "Event Handlers" });
    expect(body(fetch, "/event")).toEqual({
      name: "New notification",
      active: true,
      event: "token_init",
      handlermodule: "UserNotification",
      action: "sendmail",
      position: "post",
      ordering: 0,
      conditions: { realm: "realm2", serial: "^OATH" },
      "option.recipient": "user",
      "option.body": "Hello\nWelcome",
      "option.count": 0,
      "option.enabled": true
    });
  });

  it("retains unknown event fields and inactive state when editing", async () => {
    stubSession({ rights });
    const fetch = backend();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderPage("/config/events/details/1");
    await screen.findByLabelText(fieldLabel("recipient"));
    expect(screen.getByRole("checkbox", { name: "enabled" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "old-realm" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "old_event" })).toBeChecked();
    fill("Description", "Updated");
    await user.click(
      screen.getByRole("button", { name: "Save Event Handler Definition" })
    );
    await screen.findByRole("heading", { name: "Event Handlers" });
    expect(body(fetch, "/event")).toMatchObject({
      id: 1,
      active: false,
      name: "Updated",
      conditions: storedEvent.conditions,
      event: "token_init,old_event",
      "option.enabled": "False",
      "option.custom_option": "preserve"
    });
  });

  it("validates visible required options and clears stale fields after a module change", async () => {
    stubSession({ rights });
    const fetch = backend();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderPage("/config/events/details/1");
    await screen.findByLabelText(fieldLabel("recipient"));
    fill("email", "");
    expect(
      screen.getByRole("button", { name: "Save Event Handler Definition" })
    ).toBeDisabled();
    await user.selectOptions(
      screen.getByLabelText(fieldLabel("Handlermodule")),
      "Script"
    );
    await user.selectOptions(screen.getByLabelText(fieldLabel("Action")), "run");
    await user.selectOptions(screen.getByLabelText(fieldLabel("Position")), "pre");
    fill("script", "cleanup.sh");
    expect(screen.queryByRole("checkbox", { name: "realm" })).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Save Event Handler Definition" })
    );
    await screen.findByRole("heading", { name: "Event Handlers" });
    const request = body(fetch, "/event");
    expect(request).toMatchObject({
      handlermodule: "Script",
      action: "run",
      position: "pre",
      conditions: {},
      "option.script": "cleanup.sh"
    });
    expect(request).not.toHaveProperty("option.email");
    expect(request).not.toHaveProperty("option.custom_option");
  });

  it("creates a periodic task with a schedule, nodes, retry setting and typed options", async () => {
    stubSession({ rights });
    const fetch = backend();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderPage("/config/periodictasks/add");
    fill("Description", "Nightly cleanup");
    fill("Interval", "5 10 * * *");
    await user.click(await screen.findByRole("checkbox", { name: "node1" }));
    await user.click(screen.getByRole("checkbox", { name: "select_manually" }));
    await user.click(screen.getByRole("checkbox", { name: "Retry If Failed" }));
    await user.selectOptions(screen.getByLabelText(fieldLabel("Taskmodule")), "Simple");
    await screen.findByLabelText(fieldLabel("message"));
    expect(
      screen.getByRole("button", { name: "Save Periodic Task Definition" })
    ).toBeDisabled();
    fill("message", "Run this\nDaily");
    fill("count", "0");
    await user.click(screen.getByRole("checkbox", { name: "enabled" }));
    await user.click(
      screen.getByRole("button", { name: "Save Periodic Task Definition" })
    );
    await screen.findByRole("heading", { name: "Periodic Tasks" });
    expect(body(fetch, "/periodictask/")).toEqual({
      name: "Nightly cleanup",
      interval: "5 10 * * *",
      active: true,
      ordering: 0,
      nodes: "select_manually, node1",
      retry_if_failed: false,
      taskmodule: "Simple",
      options: { message: "Run this\nDaily", count: 0, enabled: true }
    });
  });

  it("shows last runs and preserves stored task fields while editing", async () => {
    stubSession({ rights });
    const fetch = backend();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderPage("/config/periodictasks/details/2");
    await screen.findByLabelText(fieldLabel("message"));
    expect(screen.getByText(storedTask.last_runs.node1 ?? "")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "retired-node" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "enabled" })).not.toBeChecked();
    fill("Interval", "0 * * * *");
    await user.click(
      screen.getByRole("button", { name: "Save Periodic Task Definition" })
    );
    await screen.findByRole("heading", { name: "Periodic Tasks" });
    expect(body(fetch, "/periodictask/")).toMatchObject({
      id: 2,
      active: false,
      interval: "0 * * * *",
      retry_if_failed: false,
      nodes: "node1, retired-node",
      options: storedTask.options
    });
  });

  it("clears previous task module options", async () => {
    stubSession({ rights });
    const fetch = backend();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderPage("/config/periodictasks/details/2");
    await screen.findByLabelText(fieldLabel("message"));
    await user.selectOptions(screen.getByLabelText(fieldLabel("Taskmodule")), "Other");
    await screen.findByLabelText(fieldLabel("limit"));
    fill("limit", "5");
    await user.click(
      screen.getByRole("button", { name: "Save Periodic Task Definition" })
    );
    await screen.findByRole("heading", { name: "Periodic Tasks" });
    expect(body(fetch, "/periodictask/").options).toEqual({ limit: 5 });
  });

  it.each([
    ["events", "Notify users", "/event", "/event/enable/1", "/event/1"],
    [
      "periodictasks",
      "Clean tokens",
      "/periodictask/",
      "/periodictask/enable/2",
      "/periodictask/2"
    ]
  ])(
    "filters, reorders, toggles and deletes %s",
    async (kind, name, save, enable, remove) => {
      stubSession({ rights }, { deletion_confirmation: true });
      const fetch = backend();
      vi.stubGlobal("fetch", fetch);
      const user = userEvent.setup();
      renderPage(`/config/${kind}/list`);
      await screen.findByRole("link", { name });
      fill("Filter definitions", "does-not-exist");
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
      fill("Filter definitions", "");
      const order = screen.getByLabelText(`Order for ${name}`);
      fireEvent.change(order, { target: { value: "7" } });
      fireEvent.blur(order);
      await waitFor(() => {
        expect(body(fetch, save).ordering).toBe(7);
      });
      expect(body(fetch, save).active).toBe(false);
      if (kind === "events")
        expect(body(fetch, save)).toHaveProperty("option.custom_option", "preserve");
      else
        expect(body(fetch, save)).toMatchObject({
          options: storedTask.options,
          retry_if_failed: false
        });
      await waitFor(() => {
        expect(screen.getByRole("button", { name: `Enable ${name}` })).toBeEnabled();
      });
      await user.click(screen.getByRole("button", { name: `Enable ${name}` }));
      await waitFor(() => {
        expect(findFetchCalls(fetch, "POST", enable)).toHaveLength(1);
      });
      await user.click(screen.getByRole("button", { name: "Delete" }));
      const dialog = await screen.findByRole("dialog");
      expect(findFetchCalls(fetch, "DELETE", remove)).toHaveLength(0);
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));
      await waitFor(() => {
        expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
      });
    }
  );

  it.each([
    ["events", "1", "eventhandling_read"],
    ["periodictasks", "2", "periodictask_read"]
  ])("guards %s writes with read-only permissions", async (kind, id, right) => {
    stubSession({ rights: [right] });
    const fetch = backend();
    vi.stubGlobal("fetch", fetch);
    renderPage(`/config/${kind}/details/${id}`);
    const description = await screen.findByLabelText(fieldLabel("Description"));
    expect(description).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^Save/ })).not.toBeInTheDocument();
    const form = description.closest("form");
    if (!form) throw new Error("Missing form");
    fireEvent.submit(form);
    expect(fetch.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it.each(["events", "periodictasks"])(
    "guards direct creation of %s without write rights",
    (kind) => {
      stubSession({ rights: [] });
      const fetch = backend();
      vi.stubGlobal("fetch", fetch);
      renderPage(`/config/${kind}/add`);
      expect(screen.getByRole("alert")).toHaveTextContent("You do not have permission");
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it("keeps task edits after a failed save", async () => {
    stubSession({ rights });
    const fetch = backend(true);
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderPage("/config/periodictasks/details/2");
    await screen.findByLabelText(fieldLabel("message"));
    fill("Description", "Keep edits");
    await user.click(
      screen.getByRole("button", { name: "Save Periodic Task Definition" })
    );
    expect(await screen.findByText("Definition update denied")).toBeInTheDocument();
    expect(screen.getByLabelText(fieldLabel("Description"))).toHaveValue("Keep edits");
  });

  it("does not render an empty editor for a missing event", async () => {
    stubSession({ rights });
    vi.stubGlobal("fetch", backend());
    renderPage("/config/events/details/99");
    expect(
      await screen.findByText("The event handler does not exist.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Save/ })).not.toBeInTheDocument();
  });
});

function backend(denySave = false) {
  let events = [structuredClone(storedEvent)];
  let tasks = [structuredClone(storedTask)];
  const routes = createRouteFetchMock([
    { path: "/event/", respond: () => events },
    { path: "/event/1", respond: () => events },
    { path: "/event/99", respond: () => [] },
    { path: "/event/available", respond: () => ["token_init", "validate_check"] },
    { path: "/event/handlermodules", respond: () => ["UserNotification", "Script"] },
    { path: "/event/actions/UserNotification", respond: () => eventActions },
    { path: "/event/conditions/UserNotification", respond: () => eventConditions },
    { path: "/event/positions/UserNotification", respond: () => ["pre", "post"] },
    {
      path: "/event/actions/Script",
      respond: () => ({ run: { script: { type: "str", required: true } } })
    },
    { path: "/event/conditions/Script", respond: () => ({}) },
    { path: "/event/positions/Script", respond: () => ["pre"] },
    { path: "/event", method: "POST", respond: () => 1 },
    {
      path: "/event/enable/1",
      method: "POST",
      respond: () => {
        events = events.map((e) => ({ ...e, active: true }));
        return 1;
      }
    },
    {
      path: "/event/1",
      method: "DELETE",
      respond: () => {
        events = [];
        return 1;
      }
    },
    { path: "/periodictask/", respond: () => tasks },
    { path: "/periodictask/2", respond: () => storedTask },
    { path: "/periodictask/taskmodules/", respond: () => ["Simple", "Other"] },
    { path: "/periodictask/nodes/", respond: () => ["node1"] },
    { path: "/periodictask/options/Simple", respond: () => taskOptions },
    {
      path: "/periodictask/options/Other",
      respond: () => ({ limit: { type: "int", required: true } })
    },
    { path: "/periodictask/", method: "POST", respond: () => 2 },
    {
      path: "/periodictask/enable/2",
      method: "POST",
      respond: () => {
        tasks = tasks.map((task) => ({ ...task, active: true }));
        return 2;
      }
    },
    {
      path: "/periodictask/2",
      method: "DELETE",
      respond: () => {
        tasks = [];
        return 2;
      }
    }
  ]);
  return vi.fn<typeof fetch>((input, init) => {
    if (
      denySave &&
      init?.method === "POST" &&
      new URL(getFetchUrl(input)).pathname === "/periodictask/"
    )
      return Promise.resolve(
        new Response(
          JSON.stringify({
            result: {
              status: false,
              error: { code: 303, message: "Definition update denied" }
            }
          }),
          { status: 403 }
        )
      );
    return routes(input, init);
  });
}
