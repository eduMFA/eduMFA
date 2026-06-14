import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";
import { ApiError } from "./envelope";

describe("createApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the legacy raw Authorization header and parses the envelope", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          result: {
            status: true,
            value: { ok: true }
          },
          version: "eduMFA"
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({
      getAuthToken: () => "legacy-token"
    });
    const result = await apiClient.get<{ ok: boolean }>("/client/", {
      params: { q: "test" }
    });

    const firstCall = fetchMock.mock.calls.at(0);
    expect(firstCall).toBeDefined();

    if (!firstCall) {
      throw new Error("Expected fetch to be called.");
    }

    const [url, request] = firstCall;
    const headers = new Headers(request?.headers);

    expect(getFetchUrl(url)).toContain("/client/?q=test");
    expect(headers.get("Authorization")).toBe("legacy-token");
    expect(result).toEqual({ ok: true });
  });

  it("notifies auth errors from failed eduMFA envelopes", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const onAuthError = vi.fn();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          result: {
            error: {
              code: 403,
              message: "permission denied"
            },
            status: false
          },
          version: "eduMFA"
        }),
        { status: 403 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({ onAuthError });

    await expect(apiClient.get("/client/")).rejects.toThrow(ApiError);
    expect(onAuthError).toHaveBeenCalledOnce();
  });
});

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}
