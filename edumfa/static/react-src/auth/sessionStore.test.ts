import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildSession } from "./session";

const key = `edumfa.session:${window.location.pathname}`;

/** A JWT-shaped token whose payload only carries `exp`. */
function tokenExpiringIn(seconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + seconds;

  return `h.${btoa(JSON.stringify({ exp }))}.s`;
}

/** Loads a fresh store module, like a page reload would. */
async function reload() {
  vi.resetModules();

  return import("./sessionStore");
}

const login = (token: string) =>
  buildSession({ realm: "r", role: "admin", token, username: "alice" });

describe("session persistence", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("restores a login after a reload", async () => {
    const first = await reload();
    first.setSession(login(tokenExpiringIn(600)));

    const second = await reload();

    expect(second.getSessionState().session.user?.username).toBe("alice");
    expect(second.getSessionState().session.authToken).not.toBeNull();
  });

  it("restores the lock without a token", async () => {
    const first = await reload();
    first.setSession(login(tokenExpiringIn(600)));
    first.lockSession();

    const second = await reload();

    expect(second.getSessionState().locked).toBe(true);
    expect(second.getSessionState().session.authToken).toBeNull();
    expect(second.getSessionState().session.user?.username).toBe("alice");
  });

  it("forgets the session on logout", async () => {
    const first = await reload();
    first.setSession(login(tokenExpiringIn(600)));
    first.clearSession();

    expect(window.sessionStorage.getItem(key)).toBeNull();
    expect((await reload()).getSessionState().session.user).toBeNull();
  });

  it("drops an expired token", async () => {
    const first = await reload();
    first.setSession(login(tokenExpiringIn(-5)));

    expect((await reload()).getSessionState().session.user).toBeNull();
    expect(window.sessionStorage.getItem(key)).toBeNull();
  });

  it("ignores corrupt storage", async () => {
    window.sessionStorage.setItem(key, "{not json");

    expect((await reload()).getSessionState().session.user).toBeNull();
  });
});
