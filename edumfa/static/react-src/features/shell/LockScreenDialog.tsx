import { Trans, useLingui } from "@lingui/react/macro";
import { Modal } from "@mantine/core";
import { useCallback, useState } from "react";

import { LockPasswordForm } from "./LockPasswordForm";
import { useAuth } from "@/auth/AuthProvider";
import { ChallengeResponseForm } from "@/features/login/ChallengeResponseForm";
import { useLoginFlow } from "@/features/login/loginFlowStore";
import { useAuthenticate } from "@/features/login/useAuthenticate";
import type { ChallengeAnswer } from "@/features/login/useChallengeCeremonies";
import type { AuthLoginRequest } from "@/api/auth";

/**
 * Port of `dialog.lock.html`: after the idle time the token is destroyed and
 * the user logs in again with the password only. A challenge-response login
 * continues inside the dialog, like the legacy `ng-include` did.
 */
export function LockScreenDialog() {
  const { t } = useLingui();
  const { isLocked, user } = useAuth();
  const { challenge } = useLoginFlow();
  const [attempt, setAttempt] = useState(0);
  const authenticateMutation = useAuthenticate({
    onChallengeRejected: () => {
      setAttempt((current) => current + 1);
    },
    step: "unlock"
  });
  const { mutate } = authenticateMutation;
  const username = user?.username ?? "";
  const realm = user?.realm ?? "";
  const transactionId = challenge?.transactionId ?? "";

  const answerChallenge = useCallback(
    (answer: ChallengeAnswer) => {
      const request: AuthLoginRequest = {
        password: "",
        transaction_id: transactionId,
        username,
        ...answer
      };

      if (realm) {
        request.realm = realm;
      }

      mutate(request);
    },
    [mutate, realm, transactionId, username]
  );

  if (!user) {
    return null;
  }
  const loginMessage = realm ? (
    <Trans>
      You are logged in as {username}@{realm}.
    </Trans>
  ) : (
    <Trans>You are logged in as {username}.</Trans>
  );
  return (
    <Modal
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      onClose={() => undefined}
      opened={isLocked}
      title={t`eduMFA UI is locked`}
      withCloseButton={false}
    >
      {challenge ? (
        <ChallengeResponseForm
          challenge={challenge}
          isPending={authenticateMutation.isPending}
          key={`${challenge.transactionId}:${String(attempt)}`}
          onAnswer={answerChallenge}
        />
      ) : (
        <LockPasswordForm
          isPending={authenticateMutation.isPending}
          loginMessage={loginMessage}
          onSubmit={(password) => {
            const request: AuthLoginRequest = { password, username };

            if (realm) {
              request.realm = realm;
            }

            mutate(request);
          }}
        />
      )}
    </Modal>
  );
}
