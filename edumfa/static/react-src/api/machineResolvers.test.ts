import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";
import {
  deleteMachineResolver,
  getMachineResolver,
  saveMachineResolver,
  testMachineResolver
} from "./machineResolvers";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody
} from "@/tests/fetchMockUtils";

describe("machine resolver api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the test outcome from the envelope detail", async () => {
    const fetchMock = createRouteFetchMock([
      {
        detail: () => ({
          description: "Your LDAP config seems to be OK, 3 machines found."
        }),
        method: "POST",
        path: "/machineresolver/test",
        respond: () => true
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const apiClient = createApiClient({ getAuthToken: () => "legacy-token" });

    const result = await testMachineResolver(apiClient, {
      LDAPURI: "ldap://ldap.example.com",
      type: "ldap"
    });

    expect(result).toEqual({
      description: "Your LDAP config seems to be OK, 3 machines found.",
      success: true
    });
    const [testCall] = findFetchCalls(fetchMock, "POST", "/machineresolver/test");
    expect(getJsonRequestBody(testCall?.init)).toEqual({
      LDAPURI: "ldap://ldap.example.com",
      type: "ldap"
    });
    expect(new Headers(testCall?.init?.headers).get("Authorization")).toBe(
      "legacy-token"
    );
  });

  it("reports a failed test with an empty description when none is delivered", async () => {
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/machineresolver/test", respond: () => false }
    ]);
    vi.stubGlobal("fetch", fetchMock);

    const result = await testMachineResolver(createApiClient(), { type: "hosts" });

    expect(result).toEqual({ description: "", success: false });
  });

  it("addresses a resolver by its encoded name", async () => {
    const fetchMock = createRouteFetchMock([
      { path: "/machineresolver/my%20hosts", respond: () => ({}) },
      { method: "POST", path: "/machineresolver/my%20hosts", respond: () => 1 },
      { method: "DELETE", path: "/machineresolver/my%20hosts", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const apiClient = createApiClient();

    await getMachineResolver(apiClient, "my hosts");
    await saveMachineResolver(apiClient, "my hosts", {
      filename: "/etc/hosts",
      type: "hosts"
    });
    await deleteMachineResolver(apiClient, "my hosts");

    expect(
      findFetchCalls(fetchMock, "GET", "/machineresolver/my%20hosts")
    ).toHaveLength(1);
    const [saveCall] = findFetchCalls(fetchMock, "POST", "/machineresolver/my%20hosts");
    expect(getJsonRequestBody(saveCall?.init)).toEqual({
      filename: "/etc/hosts",
      type: "hosts"
    });
    expect(
      findFetchCalls(fetchMock, "DELETE", "/machineresolver/my%20hosts")
    ).toHaveLength(1);
  });
});
