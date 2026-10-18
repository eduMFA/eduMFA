import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";

/** Shown instead of the page content when the user lacks the matching right. */
export function DefinitionPermissionAlert() {
  return (
    <Alert color="yellow" role="alert">
      <Trans>You do not have permission to open this configuration page.</Trans>
    </Alert>
  );
}
