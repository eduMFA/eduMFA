import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";

export interface IdleCountdownAlertProps {
  /** Remaining seconds of the idle warning; `null` while the user is active. */
  countdown: number | null;
}

/** The idle warning of the legacy main frame ("You will be logged out in N second(s)."). */
export function IdleCountdownAlert({ countdown }: IdleCountdownAlertProps) {
  if (countdown === null) {
    return null;
  }

  return (
    <Alert color="yellow" mt="md" role="alert" variant="light">
      <Trans>You will be logged out in {countdown} second(s).</Trans>
    </Alert>
  );
}
