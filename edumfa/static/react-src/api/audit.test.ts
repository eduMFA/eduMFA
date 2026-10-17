import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadAuditLog, getAuditLog } from "./audit";
import { createApiClient } from "./client";
import { ApiError } from "./envelope";
import { getFetchUrl } from "@/tests/fetchMockUtils";

describe("audit api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("downloads the audit CSV as raw text with the legacy auth header", async () => {
    const csv = "number,action\n1,POST /auth\n";
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(new Response(csv, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({ getAuthToken: () => "legacy-token" });
    const result = await downloadAuditLog(apiClient, { user: "*admin*" });

    const firstCall = fetchMock.mock.calls.at(0);
    expect(firstCall).toBeDefined();

    if (!firstCall) {
      throw new Error("Expected fetch to be called.");
    }

    const [url, request] = firstCall;
    const headers = new Headers(request?.headers);

    expect(getFetchUrl(url)).toContain("/audit/audit.csv?user=*admin*");
    expect(headers.get("Authorization")).toBe("legacy-token");
    expect(result).toBe(csv);
  });

  it("raises an ApiError for failed CSV downloads", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      new Response("Server Error", { status: 500, statusText: "Server Error" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({});

    await expect(downloadAuditLog(apiClient)).rejects.toThrow(ApiError);
  });

  it("unwraps the audit log envelope", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          result: {
            status: true,
            value: {
              auditcolumns: ["number", "action"],
              auditdata: [{ action: "POST /auth", number: 1 }],
              count: 1,
              current: 1,
              next: null,
              prev: null
            }
          },
          version: "eduMFA"
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({});
    const page = await getAuditLog(apiClient, { page: 1, page_size: 10 });

    expect(page.count).toBe(1);
    expect(page.auditdata.at(0)?.action).toBe("POST /auth");
  });
});
