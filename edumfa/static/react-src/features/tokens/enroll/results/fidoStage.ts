export type FidoStage = "done" | "u2f" | "webauthn";

/** Which message set applies: done, or still waiting for a U2F token or a WebAuthn authenticator. */
export function getFidoStage(pending: boolean, tokenType: string): FidoStage {
  if (!pending) {
    return "done";
  }
  return tokenType === "u2f" ? "u2f" : "webauthn";
}
