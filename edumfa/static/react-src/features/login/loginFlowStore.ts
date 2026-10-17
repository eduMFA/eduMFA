import { useSyncExternalStore } from "react";

import type { PendingChallenge, PendingPinChange } from "./loginFlow";

export interface LoginFlowState {
  challenge: PendingChallenge | null;
  pinChange: PendingPinChange | null;
}

/**
 * State the login carries between its routes. The legacy controller kept the
 * transaction and the PIN change notice on the `mainController` scope, which
 * outlives every state change; the React pages mount per route and the
 * shell unmounts while Angular owns a route, so the values live outside the
 * component tree.
 */
let state: LoginFlowState = { challenge: null, pinChange: null };
const listeners = new Set<() => void>();

function update(patch: Partial<LoginFlowState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => {
    listener();
  });
}

export function setPendingChallenge(challenge: PendingChallenge | null): void {
  update({ challenge });
}

export function setPendingPinChange(pinChange: PendingPinChange | null): void {
  update({ pinChange });
}

export function resetLoginFlow(): void {
  update({ challenge: null, pinChange: null });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): LoginFlowState {
  return state;
}

export function useLoginFlow(): LoginFlowState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
