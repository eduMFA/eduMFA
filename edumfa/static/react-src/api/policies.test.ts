import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";
import {
  deletePolicy,
  getPolicy,
  getPolicyTemplate,
  getPolicyTemplates,
  savePolicy,
  setPolicyActive
} from "./policies";
import {
  buildPolicyRequest,
  readPolicyForm
} from "@/features/config/policies/policyForm";
import {
  createEnvelopeResponse,
  getFetchUrl,
  getJsonRequestBody
} from "@/tests/fetchMockUtils";
import { storedPolicy } from "@/tests/policyFixtures";

describe("policy API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("encodes names and keeps an inactive policy inactive when saving", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createEnvelopeResponse({ "setPolicy existing": 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = createApiClient({ getAuthToken: () => "test-token" });
    await savePolicy(
      client,
      "policy with spaces",
      buildPolicyRequest(readPolicyForm(storedPolicy))
    );
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("Missing request");
    const [input, init] = call;
    expect(new URL(getFetchUrl(input)).pathname).toBe("/policy/policy%20with%20spaces");
    expect(new Headers(init?.headers).get("Authorization")).toBe("test-token");
    expect(getJsonRequestBody(init)).toMatchObject({
      active: "false",
      action: storedPolicy.action,
      conditions: storedPolicy.conditions
    });
  });

  it("uses the dedicated enable, disable, detail and delete endpoints", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(createEnvelopeResponse(1)));
    vi.stubGlobal("fetch", fetchMock);
    const client = createApiClient({});
    await setPolicyActive(client, "policy 1", true);
    await setPolicyActive(client, "policy 1", false);
    await getPolicy(client, "policy 1");
    await deletePolicy(client, "policy 1");
    expect(
      fetchMock.mock.calls.map(([input, init]) => [
        init?.method,
        new URL(getFetchUrl(input)).pathname
      ])
    ).toEqual([
      ["POST", "/policy/enable/policy%201"],
      ["POST", "/policy/disable/policy%201"],
      ["GET", "/policy/policy%201"],
      ["DELETE", "/policy/policy%201"]
    ]);
  });

  it("loads and validates public templates without credentials or auth headers", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ sample: "Sample policy" })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ name: "sample", scope: "admin", action: { enable: true } })
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await getPolicyTemplates()).toEqual({ sample: "Sample policy" });
    expect(await getPolicyTemplate("sample")).toMatchObject({
      name: "sample",
      scope: "admin",
      action: { enable: true }
    });
    for (const [input, init] of fetchMock.mock.calls) {
      expect(new URL(getFetchUrl(input)).origin).toBe(
        "https://raw.githubusercontent.com"
      );
      expect(init?.credentials).toBe("omit");
      expect(new Headers(init?.headers).has("Authorization")).toBe(false);
    }
  });

  it("rejects a malformed template", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(JSON.stringify({ name: "bad", action: "unexpected" }))
        )
    );
    await expect(getPolicyTemplate("bad")).rejects.toThrow();
  });
});
