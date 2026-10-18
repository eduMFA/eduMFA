import { useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";

/** Replaces the login form while the HSM is not ready (`HSM_READY`). */
export function HsmNotReadyAlert() {
  const { t } = useLingui();

  return (
    <Alert color="red" role="alert" variant="light">
      {t`The HSM is not ready. eduMFA can not work properly. Please start the HSM and reload this page.`}
    </Alert>
  );
}
