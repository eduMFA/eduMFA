import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";

/** Shown while the legacy auth bridge has no session for a migrated route. */
export function LoginRequiredAlert() {
  return (
    <Alert
      color="yellow"
      icon={<IconLock size={18} />}
      mb="md"
      role="alert"
      variant="light"
    >
      <Trans>Log in through the legacy UI before opening this migrated route.</Trans>
    </Alert>
  );
}
