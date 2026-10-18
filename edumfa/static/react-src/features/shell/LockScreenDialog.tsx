import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Modal, PasswordInput, Text } from "@mantine/core";
import { useCallback, useState } from "react";

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
  const [password, setPassword] = useState("");
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
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (password.length > 0) {
              const request: AuthLoginRequest = { password, username };

              if (realm) {
                request.realm = realm;
              }

              mutate(request);
            }
          }}
          role="form"
        >
          <Text mb="md" size="sm" ta="center">
            <Trans>
              You are logged in as {username}@{realm}.
            </Trans>
          </Text>
          <PasswordInput
            autoComplete="current-password"
            autoFocus
            id="lockPassword"
            label={t`Password`}
            mb="md"
            onChange={(event) => {
              setPassword(event.currentTarget.value);
            }}
            placeholder={t`Password`}
            value={password}
          />
          <Button
            disabled={password.length === 0}
            fullWidth
            loading={authenticateMutation.isPending}
            type="submit"
          >
            {t`Log In`}
          </Button>
        </form>
      )}
    </Modal>
  );
}
