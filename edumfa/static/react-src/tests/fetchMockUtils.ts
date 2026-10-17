import { vi } from "vitest";

import { buildSession, type WebUiSettingsPayload } from "@/auth/session";
import { setSession } from "@/auth/sessionStore";

/** The session fields a test provides; everything else falls back to the defaults. */
export interface TestSessionUser {
  auth_token?: string;
  menus?: string[];
  realm?: string;
  rights?: string[];
  role?: string;
  username?: string;
}

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

/**
 * Puts a session into the store, as a login would. `vitest.setup.ts` clears
 * the store after every test.
 */
export function stubSession(
  user: TestSessionUser,
  settings: WebUiSettingsPayload = {}
): void {
  setSession(
    buildSession({
      ...settings,
      menus: user.menus ?? [],
      realm: user.realm ?? "",
      rights: user.rights ?? [],
      role: user.role ?? "admin",
      token: user.auth_token ?? "test-token",
      username: user.username ?? "admin"
    })
  );
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

/** Older name of `stubSession`; `settings` are the WebUI policy values. */
export function stubLegacySession(
  user: TestSessionUser,
  settings: WebUiSettingsPayload = {}
): void {
  stubSession(user, settings);
}
