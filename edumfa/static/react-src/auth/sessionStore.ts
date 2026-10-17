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

/**
 * The session lives outside the component tree, like the legacy
 * `AuthFactory` singleton: the API client, the idle watch, the login pages
 * and the navigation all read the same state, and the value survives route
 * changes. Components subscribe through `useSessionState`.
 */
let state: SessionState = initialState;
const listeners = new Set<() => void>();

function update(patch: Partial<SessionState>): void {
  state = { ...state, ...patch };
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
