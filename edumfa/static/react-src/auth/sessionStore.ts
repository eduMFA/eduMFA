import { useSyncExternalStore } from "react";

import {
  emptySession,
  type AuthSession,
  type PendingChallenge,
  type PendingPinChange
} from "./session";

export interface SessionState {
  /** A challenge-response login waiting for its second step (login or unlock). */
  challenge: PendingChallenge | null;
  /** The idle lock: the token is gone, the user stays known for the unlock dialog. */
  locked: boolean;
  /** A PIN change the last login asked for. */
  pinChange: PendingPinChange | null;
  session: AuthSession;
}

const initialState: SessionState = {
  challenge: null,
  locked: false,
  pinChange: null,
  session: emptySession
};

/** Per tab and per installation path, so instances under one origin do not share a login. */
const storageKey = `edumfa.session:${window.location.pathname}`;

/** The JWT `exp` claim in seconds, or null when the token is not a readable JWT. */
function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1] ?? "";
    const claims = JSON.parse(
      atob(payload.replaceAll("-", "+").replaceAll("_", "/"))
    ) as { exp?: unknown };

    return typeof claims.exp === "number" ? claims.exp : null;
  } catch {
    return null;
  }
}

/**
 * Restores the session after a page reload (F5). Only a user, a live token
 * or a lock survive; challenges and PIN changes are step-by-step flows that
 * start over.
 */
function loadPersistedState(): SessionState {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    const stored = (raw ? JSON.parse(raw) : {}) as Partial<SessionState>;
    const session = stored.session;

    if (!session?.user) {
      return initialState;
    }

    const expiry = session.authToken ? tokenExpiry(session.authToken) : null;
    const expired = expiry !== null && expiry * 1000 <= Date.now();

    if (expired || (!session.authToken && !stored.locked)) {
      window.sessionStorage.removeItem(storageKey);

      return initialState;
    }

    return {
      ...initialState,
      locked: stored.locked === true,
      session: { ...emptySession, ...session }
    };
  } catch {
    return initialState;
  }
}

function persistState(next: SessionState): void {
  try {
    if (next.session.user && (next.session.authToken || next.locked)) {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ locked: next.locked, session: next.session })
      );
    } else {
      window.sessionStorage.removeItem(storageKey);
    }
  } catch {
    // Storage can be blocked; the session then simply ends with the reload.
  }
}

/**
 * The session lives outside the component tree, like the legacy
 * `AuthFactory` singleton: the API client, the idle watch, the login pages
 * and the navigation all read the same state, and the value survives route
 * changes. Components subscribe through `useSessionState`.
 */
let state: SessionState = loadPersistedState();
const listeners = new Set<() => void>();

function update(patch: Partial<SessionState>): void {
  state = { ...state, ...patch };
  persistState(state);
  listeners.forEach((listener) => {
    listener();
  });
}

export function getSessionState(): SessionState {
  return state;
}

/** A successful login (or unlock) replaces the session and ends the lock. */
export function setSession(session: AuthSession): void {
  update({ challenge: null, locked: false, session });
}

/** Logout, or an authentication error: everything of the session is dropped. */
export function clearSession(): void {
  update({ ...initialState });
}

/**
 * Port of the legacy `lock_screen`: the token is destroyed so no request can
 * use it, the user stays known so the lock dialog can offer the unlock.
 */
export function lockSession(): void {
  if (!state.session.authToken) {
    return;
  }

  update({
    challenge: null,
    locked: true,
    session: { ...state.session, authToken: null }
  });
}

export function setPendingChallenge(challenge: PendingChallenge | null): void {
  update({ challenge });
}

export function setPendingPinChange(pinChange: PendingPinChange | null): void {
  update({ pinChange });
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function useSessionState(): SessionState {
  return useSyncExternalStore(subscribeSession, getSessionState, getSessionState);
}
