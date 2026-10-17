import { useLingui } from "@lingui/react/macro";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  buildSessionFromLogin,
  derivePendingChallenge,
  getPendingPinChange,
  getStartRoute
} from "./loginFlow";
import { setPendingChallenge, setPendingPinChange } from "./loginFlowStore";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  authenticate,
  type AuthLoginEnvelope,
  type AuthLoginRequest
} from "@/api/auth";
import { useAuth } from "@/auth/AuthProvider";
import { notify } from "@/lib/notify";

export interface UseAuthenticateOptions {
  /** A challenge answer was rejected; FIDO tokens are asked for a second signature. */
  onChallengeRejected?: () => void;
  /** The login page moves to `/response` for a challenge; the response page stays. */
  step: "login" | "response";
}

export type AuthenticateMutation = UseMutationResult<
  AuthLoginEnvelope,
  Error,
  AuthLoginRequest
>;

/**
 * Port of the legacy `authenticate` / `do_login_stuff` pair. A login that
 * returns a token is handed to the Angular `mainController` through the
 * bridge, which stores the session, starts the idle timer, opens the welcome
 * dialogs and navigates to the start page as before; without a bridge
 * (tests, standalone) the React session is set directly. A response with a
 * `transaction_id` becomes the pending challenge of the response page.
 */
export function useAuthenticate({
  onChallengeRejected,
  step
}: UseAuthenticateOptions): AuthenticateMutation {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { t } = useLingui();

  return useMutation({
    mutationFn: (request: AuthLoginRequest) => authenticate(apiClient, request),
    onError: (error) => {
      if (step === "response") {
        notify(
          t`Challenge Response Authentication. Your response was not valid!`,
          "warning"
        );
        onChallengeRejected?.();

        return;
      }

      notify(`${t`Authentication failed.`} ${error.message}`, "danger");
    },
    onSuccess: (envelope, request) => {
      const { value } = envelope.result;
      const detail = envelope.detail;

      if (value.token) {
        setPendingChallenge(null);
        setPendingPinChange(getPendingPinChange(detail));

        const nextPinChange = detail?.next_pin_change;

        if (nextPinChange && !detail.serial) {
          notify(t`Your OTP pin expires on ${nextPinChange}`, "warning");
        }

        const bridge = window.eduMfaLegacyAuth;

        if (bridge?.login) {
          bridge.login(envelope);

          return;
        }

        setSession(buildSessionFromLogin(value));
        void navigate(getStartRoute(value, detail));

        return;
      }

      const challenge = derivePendingChallenge(detail, {
        realm: request.realm ?? "",
        username: request.username
      });

      if (challenge) {
        setPendingChallenge(challenge);
        notify(
          t`Challenge Response Authentication. You are not completely authenticated, yet.`,
          "warning"
        );

        if (step === "login") {
          void navigate("/response");
        }

        return;
      }

      notify(t`Something went wrong!`, "danger");
      void navigate("/login");
    }
  });
}
