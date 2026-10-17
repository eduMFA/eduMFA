import { Trans } from "@lingui/react/macro";
import { Alert, Anchor, Paper, Title } from "@mantine/core";
import { useCallback, useState } from "react";

import { ChallengeResponseForm } from "./ChallengeResponseForm";
import { useLoginFlow } from "./loginFlowStore";
import { LoginShell } from "./LoginShell";
import { useAuthenticate } from "./useAuthenticate";
import type { ChallengeAnswer } from "./useChallengeCeremonies";
import type { AuthLoginRequest } from "@/api/auth";
import { hashHref } from "@/lib/hashbang";

/**
 * Port of `enter-response.html`: the second step of a challenge-response
 * login. A rejected answer remounts the form, which asks U2F / WebAuthn
 * tokens for a second signature like the legacy controller did.
 */
export function ResponsePage() {
  const { challenge } = useLoginFlow();
  const [attempt, setAttempt] = useState(0);
  const authenticateMutation = useAuthenticate({
    onChallengeRejected: () => {
      setAttempt((current) => current + 1);
    },
    step: "response"
  });
  const { mutate } = authenticateMutation;
  const realm = challenge?.realm ?? "";
  const transactionId = challenge?.transactionId ?? "";
  const username = challenge?.username ?? "";

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

  if (!challenge) {
    return (
      <LoginShell>
        <Alert color="yellow" role="alert" variant="light">
          <Trans>
            There is no pending challenge. Please{" "}
            <Anchor href={hashHref("/login")} inherit>
              log in
            </Anchor>{" "}
            first.
          </Trans>
        </Alert>
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <Paper p="xl" radius="md" withBorder>
        <Title mb="md" order={2} size="h3" ta="center">
          <Trans>Response</Trans>
        </Title>
        <ChallengeResponseForm
          challenge={challenge}
          isPending={authenticateMutation.isPending}
          key={`${challenge.transactionId}:${String(attempt)}`}
          onAnswer={answerChallenge}
        />
      </Paper>
    </LoginShell>
  );
}
