import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";
import {
  buildRealmRequest,
  clearDefaultRealm,
  deleteRealm,
  setDefaultRealm,
  setRealm
} from "./realms";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody
} from "@/tests/fetchMockUtils";

describe("realm api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the legacy realm payload from the selected resolvers", () => {
    expect(
      buildRealmRequest({
        ldap1: { priority: 2, selected: true },
        passwd1: { priority: null, selected: true },
        sql1: { priority: 1, selected: false }
      })
    ).toEqual({
      "priority.ldap1": 2,
      resolvers: "ldap1,passwd1"
    });
  });

  it("sends an empty resolver list when nothing is selected", () => {
    expect(buildRealmRequest({})).toEqual({ resolvers: "" });
  });

  it("posts the realm definition and the default realm calls", async () => {
    const fetchMock = createRouteFetchMock([
      {
        method: "POST",
        path: "/realm/realm1",
        respond: () => ({ added: ["ldap1"], failed: [] })
      },
      { method: "DELETE", path: "/realm/realm1", respond: () => 1 },
      { method: "POST", path: "/defaultrealm/realm1", respond: () => true },
      { method: "DELETE", path: "/defaultrealm", respond: () => true }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const apiClient = createApiClient({ getAuthToken: () => "legacy-token" });

    await expect(
      setRealm(apiClient, "realm1", { "priority.ldap1": 1, resolvers: "ldap1" })
    ).resolves.toEqual({ added: ["ldap1"], failed: [] });
    await deleteRealm(apiClient, "realm1");
    await setDefaultRealm(apiClient, "realm1");
    await clearDefaultRealm(apiClient);

    const [setCall] = findFetchCalls(fetchMock, "POST", "/realm/realm1");
    expect(getJsonRequestBody(setCall?.init)).toEqual({
      "priority.ldap1": 1,
      resolvers: "ldap1"
    });
    expect(findFetchCalls(fetchMock, "DELETE", "/realm/realm1")).toHaveLength(1);
    const [defaultCall] = findFetchCalls(fetchMock, "POST", "/defaultrealm/realm1");
    expect(getJsonRequestBody(defaultCall?.init)).toEqual({});
    expect(new Headers(defaultCall?.init?.headers).get("Content-Type")).toBe(
      "application/json"
    );
    expect(findFetchCalls(fetchMock, "DELETE", "/defaultrealm")).toHaveLength(1);
  });
});
