import { vi } from "vitest";

import type {
  LegacyEduMfaAuthBridge,
  LegacyEduMfaUser,
  LegacyWebUiSettings
} from "@/global";

export function createEnvelopeResponse(
  value: unknown,
  detail?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      ...(detail ? { detail } : {}),
      id: 1,
      jsonrpc: "2.0",
      result: { status: true, value },
      version: "eduMFA"
    }),
    { status: 200 }
  );
}

export function createLegacyAuthBridge(
  user: LegacyEduMfaUser,
  settings: LegacyWebUiSettings = {}
): LegacyEduMfaAuthBridge {
  return {
    getAuthToken: () => user.auth_token,
    getRealm: () => user.realm,
    getRole: () => user.role,
    getSettings: () => settings,
    getUser: () => user
  };
}

export function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

export function getJsonRequestBody(
  init: RequestInit | undefined
): Record<string, unknown> {
  if (typeof init?.body !== "string") {
    throw new Error("Expected a JSON string request body.");
  }

  return JSON.parse(init.body) as Record<string, unknown>;
}

export interface FetchRoute {
  /** Optional `detail` section of the envelope, e.g. the enrollment data. */
  detail?: (url: URL, init: RequestInit | undefined) => Record<string, unknown>;
  method?: string;
  /** Exact pathname, e.g. "/user/" or "/machine/token". */
  path: string;
  respond: (url: URL, init: RequestInit | undefined) => unknown;
}

export interface RecordedFetchCall {
  init: RequestInit | undefined;
  url: URL;
}

/**
 * Builds a `fetch` mock that answers each route with an eduMFA envelope and
 * rejects anything unexpected, so a page under test cannot silently hit an
 * endpoint the test did not anticipate.
 */
export function createRouteFetchMock(
  routes: FetchRoute[]
): ReturnType<typeof vi.fn<typeof fetch>> {
  const fetchMock = vi.fn<typeof fetch>();

  fetchMock.mockImplementation((input, init) => {
    const url = new URL(getFetchUrl(input));
    const method = (init?.method ?? "GET").toUpperCase();
    const route = routes.find(
      (candidate) =>
        candidate.path === url.pathname &&
        (candidate.method ?? "GET").toUpperCase() === method
    );

    if (!route) {
      return Promise.reject(new Error(`Unexpected request: ${method} ${url.pathname}`));
    }

    return Promise.resolve(
      createEnvelopeResponse(route.respond(url, init), route.detail?.(url, init))
    );
  });

  return fetchMock;
}

export function findFetchCalls(
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>,
  method: string,
  pathname: string
): RecordedFetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => ({ init, url: new URL(getFetchUrl(input)) }))
    .filter(
      ({ init, url }) =>
        url.pathname === pathname &&
        (init?.method ?? "GET").toUpperCase() === method.toUpperCase()
    );
}

/** Installs a legacy auth bridge; `settings` are the WebUI policy values. */
export function stubLegacySession(
  user: LegacyEduMfaUser,
  settings: LegacyWebUiSettings = {}
): void {
  vi.stubGlobal("eduMfaLegacyAuth", createLegacyAuthBridge(user, settings));
}
