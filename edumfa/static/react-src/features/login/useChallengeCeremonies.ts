import { useEffect, useRef, useState } from "react";

import { usePollTransaction } from "./usePollTransaction";
import type { AuthLoginRequest } from "@/api/auth";
import type { PendingChallenge } from "@/auth/session";
import { signU2fChallenge } from "@/auth/u2f";
import { signWebAuthnChallenge } from "@/auth/webauthn";

/** What a challenge answer adds to the username, realm and transaction id. */
export type ChallengeAnswer = Omit<
  AuthLoginRequest,
  "realm" | "transaction_id" | "username"
>;

export interface ChallengeCeremoniesOptions {
  challenge: PendingChallenge;
  onAnswer: (answer: ChallengeAnswer) => void;
}

/**
 * The automatic second steps of a challenge: out-of-band tokens are polled,
 * U2F and WebAuthn tokens are asked for a signature as soon as the component
 * mounts (the pages remount the form for a retry). Returns the error of a
 * failed FIDO ceremony.
 */
export function useChallengeCeremonies({
  challenge,
  onAnswer
}: ChallengeCeremoniesOptions): unknown {
  const [fidoError, setFidoError] = useState<unknown>(null);
  const u2fCeremonyStarted = useRef<string | null>(null);
  const { polling, transactionId, u2fSignRequests, webAuthnSignRequests } = challenge;

  usePollTransaction({
    enabled: polling,
    onAnswered: () => {
      onAnswer({});
    },
    transactionId
  });

  useEffect(() => {
    if (webAuthnSignRequests.length === 0) {
      return undefined;
    }

    const controller = new AbortController();

    void signWebAuthnChallenge(webAuthnSignRequests, controller.signal).then(
      (response) => {
        if (!controller.signal.aborted) {
          onAnswer(response);
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setFidoError(error);
        }
      }
    );

    return () => {
      controller.abort();
    };
  }, [onAnswer, webAuthnSignRequests]);

  useEffect(() => {
    if (u2fSignRequests.length === 0) {
      return;
    }

    // The U2F callback API cannot be aborted, so one ceremony runs per
    // challenge even when the effect is re-run.
    if (u2fCeremonyStarted.current === transactionId) {
      return;
    }

    u2fCeremonyStarted.current = transactionId;
    void signU2fChallenge(u2fSignRequests).then(
      (response) => {
        onAnswer(response);
      },
      (error: unknown) => {
        setFidoError(error);
      }
    );
  }, [onAnswer, transactionId, u2fSignRequests]);

  return fidoError;
}
