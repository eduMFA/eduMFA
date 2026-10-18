import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";
import { summarizeFailures } from "./summarizeFailures";
import type { AuditEntry } from "@/api/audit";
import { createRouteFetchMock, stubLegacySession } from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

function auditEntry(overrides: Partial<AuditEntry>): AuditEntry {
  return {
    action: "POST /validate/check",
    action_detail: "",
    administrator: "",
    clearance_level: null,
    client: "",
    date: "2026-10-17T06:00:00",
    duration: null,
    edumfa_server: "",
    info: "",
    log_level: null,
    missing_line: "OK",
    number: 1,
    policies: "",
    realm: "realm1",
    resolver: "",
    serial: "HOTP0001",
    sig_check: "OK",
    startdate: null,
    success: 0,
    thread_id: "",
    token_type: "hotp",
    user: "alice",
    ...overrides
  };
}

describe("summarizeFailures", () => {
  it("groups failures by user, newest first, and keeps user-less serials", () => {
    const summary = summarizeFailures([
      auditEntry({ date: "2026-10-17T06:00:00", number: 1, user: "alice" }),
      auditEntry({ date: "2026-10-17T07:00:00", number: 2, user: "bob" }),
      auditEntry({ date: "2026-10-17T08:00:00", number: 3, user: "alice" }),
      auditEntry({ date: "2026-10-17T05:00:00", number: 4, serial: "SPASS1", user: "" })
    ]);

    expect(summary.users).toEqual([
      { fails: 2, latestError: "2026-10-17T08:00:00", realm: "realm1", user: "alice" },
      { fails: 1, latestError: "2026-10-17T07:00:00", realm: "realm1", user: "bob" }
    ]);
    expect(summary.serials).toEqual(["SPASS1"]);
  });
});

describe("DashboardPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the token counts, authentications, policies and events", async () => {
    stubLegacySession({
      auth_token: "legacy-token",
      menus: [],
      realm: "",
      rights: ["tokenlist", "auditlog", "policyread", "eventhandling_read"],
      role: "admin",
      username: "admin"
    });
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        {
          path: "/token/",
          respond: (url) => {
            const kind = url.searchParams.get("infovalue");
            const unassigned = url.searchParams.get("assigned") === "False";
            const count =
              kind === null
                ? 22
                : kind === "hardware"
                  ? unassigned
                    ? 2
                    : 5
                  : unassigned
                    ? 7
                    : 17;

            return { count, current: 1, next: null, prev: null, tokens: [] };
          }
        },
        {
          path: "/audit/",
          respond: (url) => {
            const action = url.searchParams.get("action") ?? "";

            if (action.startsWith("POST /")) {
              return {
                auditcolumns: [],
                auditdata:
                  action === "POST /policy*"
                    ? [
                        auditEntry({
                          action: "POST /policy/pol1",
                          action_detail: "",
                          administrator: "admin",
                          date: "2026-10-17T09:30:00",
                          number: 9,
                          user: ""
                        })
                      ]
                    : [],
                count: 0,
                current: 1,
                next: null,
                prev: null
              };
            }

            const success = url.searchParams.get("success") === "1";

            return {
              auditcolumns: [],
              auditdata: success ? [] : [auditEntry({ number: 5, user: "alice" })],
              count: success ? 40 : 1,
              current: 1,
              next: null,
              prev: null
            };
          }
        },
        {
          path: "/policy/",
          respond: () => [
            { action: {}, active: true, name: "pol1", scope: "webui" },
            { action: {}, active: false, name: "pol2", scope: "admin" }
          ]
        },
        {
          path: "/event/",
          respond: () => [
            {
              active: true,
              event: ["token_init"],
              handlermodule: "UserNotification",
              id: 3,
              name: "notify"
            }
          ]
        }
      ])
    );

    renderWithProviders(<DashboardPage />, { route: "/dashboard" });

    await screen.findByText("22");
    expect(within(field("hardware")).getByText("5")).toBeInTheDocument();
    expect(within(field("unassignedSoftware")).getByText("7")).toBeInTheDocument();
    expect(within(field("authSuccess")).getByText("40")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "alice@realm1[1]" })
    ).toHaveAttribute("href", "#!/user/details/realm1/alice");
    expect(await screen.findByText("POST /policy/pol1")).toBeInTheDocument();
    expect(screen.getByText("2026-10-17 09:30")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "pol1" })).toHaveAttribute(
      "href",
      "#!/config/policies/details/pol1"
    );
    expect(within(field("inactivePolicies")).getByText("1")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "notify" })).toHaveAttribute(
      "href",
      "#!/config/events/details/3"
    );
  });
});

function field(name: string): HTMLElement {
  const element = document.querySelector(`[data-field="${name}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No field ${name}`);
  }

  return element;
}
