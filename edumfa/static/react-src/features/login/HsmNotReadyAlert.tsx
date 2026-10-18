import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";

/** Replaces the login form while the HSM is not ready (`HSM_READY`). */
export function HsmNotReadyAlert() {
  return (
    <Alert color="red" role="alert" variant="light">
      <Trans>
        The HSM is not ready. eduMFA can not work properly. Please start the HSM and
        reload this page.
      </Trans>
    </Alert>
  );
}
