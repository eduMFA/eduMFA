import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuditLogPage } from "./AuditLogPage";
import {
  createEnvelopeResponse,
  createLegacyAuthBridge,
  getFetchUrl
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const auditPage = {
  auditcolumns: ["number", "date", "action", "success", "serial", "user", "realm"],
  auditdata: [
    {
      action: "POST /auth",
      date: "2026-08-15T10:00:00",
      number: 2,
      realm: "realm1",
      serial: null,
      success: 1,
      user: "alice"
    },
    {
      action: "POST /validate/check",
      date: "2026-08-15T09:59:00",
      number: 1,
      realm: "realm1",
      serial: "OATH0001,TOTP0002",
      success: 0,
      user: "bob"
    }
  ],
  count: 2,
  current: 1,
  next: null,
  prev: null
};

describe("AuditLogPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the audit table and refetches with wildcard filters", async () => {
    stubAdminSession(["auditlog", "auditlog_download"]);
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementation(() =>
      Promise.resolve(createEnvelopeResponse(auditPage))
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<AuditLogPage />, { route: "/audit/log" });

    await screen.findByText("POST /auth");
    expect(screen.getByText("2 entries found.")).toBeInTheDocument();

    const serialCellLink = screen.getByRole("link", { name: "OATH0001" });
    expect(serialCellLink).toHaveAttribute("href", "#!/token/details/OATH0001");

    const userCellLink = screen.getByRole("link", { name: "alice" });
    expect(userCellLink).toHaveAttribute("href", "#!/user/details/realm1/alice");

    expect(
      screen.getByRole("button", { name: "Download audit log as CSV" })
    ).toBeInTheDocument();

    const firstCallParams = getRequestedParams(fetchMock, 0);
    expect(firstCallParams.get("sortorder")).toBe("desc");
    expect(firstCallParams.get("page_size")).toBe("10");
    expect(firstCallParams.get("page")).toBe("1");

    await user.type(screen.getByLabelText("user"), "ali");

    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      expect(lastCall).toBeDefined();

      if (!lastCall) {
        throw new Error("Expected fetch to be called.");
      }

      const requestedUrl = new URL(getFetchUrl(lastCall[0]));
      expect(requestedUrl.searchParams.get("user")).toBe("*ali*");
    });
  });

  it("seeds the serial filter from the hash query like the legacy state", async () => {
    stubAdminSession([]);
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementation(() =>
      Promise.resolve(createEnvelopeResponse(auditPage))
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AuditLogPage />, { route: "/audit/log?serial=OATH0001" });

    await screen.findByText("POST /auth");

    const firstCallParams = getRequestedParams(fetchMock, 0);
    expect(firstCallParams.get("serial")).toBe("*OATH0001*");
    expect(screen.getByLabelText("serial")).toHaveValue("OATH0001");
  });

  it("hides the CSV download button without the auditlog_download right", async () => {
    stubAdminSession([]);
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementation(() =>
      Promise.resolve(createEnvelopeResponse(auditPage))
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AuditLogPage />, { route: "/audit/log" });

    await screen.findByText("POST /auth");
    expect(
      screen.queryByRole("button", { name: "Download audit log as CSV" })
    ).not.toBeInTheDocument();
  });

  it("filters success as a boolean and lists it as a removable chip", async () => {
    stubAdminSession([]);
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementation(() =>
      Promise.resolve(createEnvelopeResponse(auditPage))
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<AuditLogPage />, { route: "/audit/log" });

    await screen.findByText("POST /auth");
    await user.selectOptions(screen.getByLabelText("success"), "0");

    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      expect(lastCall).toBeDefined();

      if (!lastCall) {
        throw new Error("Expected fetch to be called.");
      }

      expect(new URL(getFetchUrl(lastCall[0])).searchParams.get("success")).toBe("0");
    });

    const chipRemoveButton = screen.getByRole("button", {
      name: "Remove filter success"
    });
    expect(chipRemoveButton.closest('[data-chip="success"]')).toHaveTextContent(
      "success: no"
    );

    await user.click(chipRemoveButton);

    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      expect(lastCall).toBeDefined();

      if (!lastCall) {
        throw new Error("Expected fetch to be called.");
      }

      expect(new URL(getFetchUrl(lastCall[0])).searchParams.has("success")).toBe(false);
    });
    expect(
      screen.queryByRole("button", { name: "Remove filter success" })
    ).not.toBeInTheDocument();
  });

  it("passes user-supplied wildcards through unchanged", async () => {
    stubAdminSession([]);
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementation(() =>
      Promise.resolve(createEnvelopeResponse(auditPage))
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<AuditLogPage />, { route: "/audit/log" });

    await screen.findByText("POST /auth");
    await user.type(screen.getByLabelText("action"), "POST*{Enter}");

    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      expect(lastCall).toBeDefined();

      if (!lastCall) {
        throw new Error("Expected fetch to be called.");
      }

      expect(new URL(getFetchUrl(lastCall[0])).searchParams.get("action")).toBe(
        "POST*"
      );
    });
  });

  it("renders the success column as a boolean pill", async () => {
    stubAdminSession([]);
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementation(() =>
      Promise.resolve(createEnvelopeResponse(auditPage))
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AuditLogPage />, { route: "/audit/log" });

    const failedRow = (await screen.findByText("POST /validate/check")).closest("tr");
    expect(failedRow).not.toBeNull();
    expect(failedRow).toHaveTextContent("failed");
    expect(failedRow?.querySelector('[data-value="false"]')).not.toBeNull();

    const okRow = screen.getByText("POST /auth").closest("tr");
    expect(okRow?.querySelector('[data-value="true"]')).not.toBeNull();
  });
});

function stubAdminSession(rights: string[]): void {
  vi.stubGlobal(
    "eduMfaLegacyAuth",
    createLegacyAuthBridge({
      auth_token: "legacy-token",
      menus: [],
      realm: "realm1",
      rights,
      role: "admin",
      username: "admin"
    })
  );
}

function getRequestedParams(
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>,
  callIndex: number
): URLSearchParams {
  const call = fetchMock.mock.calls.at(callIndex);

  if (!call) {
    throw new Error(`Expected fetch call ${String(callIndex)} to exist.`);
  }

  return new URL(getFetchUrl(call[0])).searchParams;
}
