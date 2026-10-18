import { useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";

/** Shown instead of the page content when the user lacks the matching right. */
export function DefinitionPermissionAlert() {
  const { t } = useLingui();

  return (
    <Alert color="yellow" role="alert">
      {t`You do not have permission to open this configuration page.`}
    </Alert>
  );
}
