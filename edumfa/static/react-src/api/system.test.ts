import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";
import {
  deleteSystemConfig,
  getRandom,
  getSystemDocumentation,
  saveSystemConfig
} from "./system";
import {
  createEnvelopeResponse,
  getFetchUrl,
  getJsonRequestBody
} from "@/tests/fetchMockUtils";

describe("system api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the documentation as plain text with the legacy auth header", async () => {
    const documentation = "System\n======\n";
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(new Response(documentation, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({ getAuthToken: () => "legacy-token" });
    const result = await getSystemDocumentation(apiClient);

    const [url, request] = callAt(fetchMock, 0);
    expect(getFetchUrl(url)).toContain("/system/documentation");
    expect(new Headers(request?.headers).get("Authorization")).toBe("legacy-token");
    expect(result).toBe(documentation);
  });

  it("raises the policy error when the documentation is denied", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          result: {
            error: { code: 303, message: "system_documentation is not allowed" },
            status: false
          }
        }),
        { status: 403 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({});

    await expect(getSystemDocumentation(apiClient)).rejects.toMatchObject({
      name: "ApiError",
      message: "system_documentation is not allowed",
      code: 303,
      status: 403
    });
  });

  it("requests random key material with length and encoding", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(createEnvelopeResponse("cmFuZG9t"));
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({});
    const value = await getRandom(apiClient, 20, "b64");

    const [url] = callAt(fetchMock, 0);
    const requestUrl = new URL(getFetchUrl(url));
    expect(requestUrl.pathname).toBe("/system/random");
    expect(requestUrl.searchParams.get("len")).toBe("20");
    expect(requestUrl.searchParams.get("encode")).toBe("b64");
    expect(value).toBe("cmFuZG9t");
  });

  it("posts config entries to setConfig and deletes a key by path", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(createEnvelopeResponse({ splitAtSign: "update" }))
      .mockResolvedValueOnce(createEnvelopeResponse(1));
    vi.stubGlobal("fetch", fetchMock);

    const apiClient = createApiClient({});
    const saved = await saveSystemConfig(apiClient, {
      "PrependPin.type": "public",
      splitAtSign: true
    });
    const deleted = await deleteSystemConfig(apiClient, "question.question.0");

    expect(saved).toEqual({ splitAtSign: "update" });
    expect(deleted).toBe(1);

    const [saveUrl, saveRequest] = callAt(fetchMock, 0);
    expect(getFetchUrl(saveUrl)).toContain("/system/setConfig");
    expect(saveRequest?.method).toBe("POST");
    expect(getJsonRequestBody(saveRequest)).toEqual({
      "PrependPin.type": "public",
      splitAtSign: true
    });

    const [deleteUrl, deleteRequest] = callAt(fetchMock, 1);
    expect(new URL(getFetchUrl(deleteUrl)).pathname).toBe(
      "/system/question.question.0"
    );
    expect(deleteRequest?.method).toBe("DELETE");
  });
});

function callAt(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, index: number) {
  const call = fetchMock.mock.calls.at(index);

  if (!call) {
    throw new Error(`Expected fetch call ${String(index)}.`);
  }

  return call;
}
