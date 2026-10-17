import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  PasswordInput,
  Text,
  Title
} from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLoginFlow } from "./loginFlowStore";
import { LoginShell } from "./LoginShell";
import { useAuthenticate } from "./useAuthenticate";
import { usePollTransaction } from "./usePollTransaction";
import type { AuthLoginRequest } from "@/api/auth";
import { signU2fChallenge } from "@/auth/u2f";
import { useFidoErrorMessage } from "@/auth/useFidoErrorMessage";
import { signWebAuthnChallenge } from "@/auth/webauthn";
import { hashHref } from "@/lib/hashbang";

/** What a challenge answer adds to the username, realm and transaction id. */
type ChallengeAnswer = Omit<AuthLoginRequest, "realm" | "transaction_id" | "username">;

/**
 * Port of `enter-response.html`: the second step of a challenge-response
 * login. Interactive tokens get an input, out-of-band tokens are polled and
 * U2F / WebAuthn tokens are asked for a signature as soon as the page opens,
 * and again after a rejected answer, like the legacy controller did.
 */
export function ResponsePage() {
  const { t } = useLingui();
  const { challenge } = useLoginFlow();
  const describeFidoError = useFidoErrorMessage("authentication");
  const [otp, setOtp] = useState("");
  const [fidoAttempt, setFidoAttempt] = useState(0);
  const [fidoError, setFidoError] = useState<unknown>(null);
  const authenticateMutation = useAuthenticate({
    onChallengeRejected: () => {
      setOtp("");
      setFidoError(null);
      setFidoAttempt((attempt) => attempt + 1);
    },
    step: "response"
  });
  const { mutate } = authenticateMutation;
  const realm = challenge?.realm ?? "";
  const transactionId = challenge?.transactionId ?? "";
  const username = challenge?.username ?? "";
  const u2fSignRequests = challenge?.u2fSignRequests;
  const webAuthnSignRequests = challenge?.webAuthnSignRequests;
  const u2fCeremonyStarted = useRef<string | null>(null);

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
  const finishPolledLogin = useCallback(() => {
    answerChallenge({});
  }, [answerChallenge]);

  usePollTransaction({
    enabled: challenge?.polling === true,
    onAnswered: finishPolledLogin,
    transactionId
  });

  useEffect(() => {
    if (!webAuthnSignRequests || webAuthnSignRequests.length === 0) {
      return undefined;
    }

    const controller = new AbortController();

    void signWebAuthnChallenge(webAuthnSignRequests, controller.signal).then(
      (response) => {
        if (!controller.signal.aborted) {
          answerChallenge(response);
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
  }, [answerChallenge, fidoAttempt, webAuthnSignRequests]);

  useEffect(() => {
    if (!u2fSignRequests || u2fSignRequests.length === 0) {
      return;
    }

    // The U2F callback API cannot be aborted, so one ceremony runs per
    // challenge and attempt even when the effect is re-run.
    const ceremonyKey = `${transactionId}:${String(fidoAttempt)}`;

    if (u2fCeremonyStarted.current === ceremonyKey) {
      return;
    }

    u2fCeremonyStarted.current = ceremonyKey;
    void signU2fChallenge(u2fSignRequests).then(
      (response) => {
        answerChallenge(response);
      },
      (error: unknown) => {
        setFidoError(error);
      }
    );
  }, [answerChallenge, fidoAttempt, transactionId, u2fSignRequests]);

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

  const multipleTokens = challenge.serials.length > 1;

  return (
    <LoginShell>
      {fidoError !== null ? (
        <Alert color="red" mb="md" role="alert" variant="light">
          {describeFidoError(fidoError)}
        </Alert>
      ) : null}
      <Paper p="xl" radius="md" withBorder>
        <Title mb="md" order={2} size="h3" ta="center">
          <Trans>Response</Trans>
        </Title>
        {multipleTokens ? (
          <Text mb="md" ta="center">
            <Trans>Please confirm with one of these tokens:</Trans>{" "}
            {challenge.serials.join(" ")}
          </Text>
        ) : challenge.message ? (
          <Text mb="md" ta="center">
            {challenge.message}
          </Text>
        ) : null}
        {challenge.image ? (
          <Center mb="md">
            <img alt="" src={challenge.image} width={250} />
          </Center>
        ) : null}
        {challenge.polling ? (
          <Group c="dimmed" gap="xs" justify="center" mb="md" role="status">
            <Loader size="xs" />
            <Text size="sm">
              <Trans>Waiting for the confirmation…</Trans>
            </Text>
          </Group>
        ) : null}
        {challenge.showInput ? (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();

              if (otp.length > 0) {
                answerChallenge({ password: otp });
              }
            }}
            role="form"
          >
            <PasswordInput
              aria-label={t`Response`}
              autoComplete="one-time-code"
              autoFocus
              id="otp"
              mb="md"
              onChange={(event) => {
                setOtp(event.currentTarget.value);
              }}
              placeholder={t`Response`}
              value={otp}
            />
            <Button
              disabled={otp.length === 0}
              fullWidth
              loading={authenticateMutation.isPending}
              type="submit"
            >
              <Trans>Log In</Trans>
            </Button>
          </form>
        ) : null}
      </Paper>
    </LoginShell>
  );
}
