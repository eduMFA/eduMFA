import type { PendingChallenge, PendingPinChange } from "@/auth/session";
import {
  setPendingChallenge,
  setPendingPinChange,
  useSessionState
} from "@/auth/sessionStore";

export { setPendingChallenge, setPendingPinChange };

export interface LoginFlowState {
  challenge: PendingChallenge | null;
  pinChange: PendingPinChange | null;
}

/**
 * The state the login carries between its routes (the pending challenge of
 * `/response`, the PIN change notice of `/pinchange`). It is part of the
 * session store, so it outlives the route components like the legacy
 * `mainController` scope did.
 */
export function useLoginFlow(): LoginFlowState {
  const { challenge, pinChange } = useSessionState();

  return { challenge, pinChange };
}

export function resetLoginFlow(): void {
  setPendingChallenge(null);
  setPendingPinChange(null);
}
