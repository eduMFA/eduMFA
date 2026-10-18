import { useLingui } from "@lingui/react/macro";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  PasswordInput,
  Text
} from "@mantine/core";
import { useState } from "react";

import { useChallengeCeremonies, type ChallengeAnswer } from "./useChallengeCeremonies";
import type { PendingChallenge } from "@/auth/session";
import { useFidoErrorMessage } from "@/auth/useFidoErrorMessage";

export interface ChallengeResponseFormProps {
  challenge: PendingChallenge;
  isPending: boolean;
  /** Stable callback: the ceremonies restart when it changes. */
  onAnswer: (answer: ChallengeAnswer) => void;
}

/**
 * The body of `enter-response.html`: the challenge message, the QR image,
 * the polling notice and the OTP input. Mount it with a key per attempt so a
 * rejected answer asks the FIDO tokens again, like the legacy controller.
 */
export function ChallengeResponseForm({
  challenge,
  isPending,
  onAnswer
}: ChallengeResponseFormProps) {
  const { t } = useLingui();
  const describeFidoError = useFidoErrorMessage("authentication");
  const [otp, setOtp] = useState("");
  const fidoError = useChallengeCeremonies({ challenge, onAnswer });
  const multipleTokens = challenge.serials.length > 1;

  return (
    <>
      {fidoError !== null ? (
        <Alert color="red" mb="md" role="alert" variant="light">
          {describeFidoError(fidoError)}
        </Alert>
      ) : null}
      {multipleTokens ? (
        <Text mb="md" ta="center">
          {t`Please confirm with one of these tokens:`} {challenge.serials.join(" ")}
        </Text>
      ) : null}
      {!multipleTokens && challenge.message ? (
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
          <Text size="sm">{t`Waiting for the confirmation…`}</Text>
        </Group>
      ) : null}
      {challenge.showInput ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (otp.length > 0) {
              onAnswer({ password: otp });
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
            loading={isPending}
            type="submit"
          >
            {t`Log In`}
          </Button>
        </form>
      ) : null}
    </>
  );
}
