import { Trans } from "@lingui/react/macro";
import { Alert, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import { LoginShell } from "./LoginShell";

/** Port of `offline.html`: shown when the API cannot be reached. */
export function OfflinePage() {
  return (
    <LoginShell>
      <Alert
        color="red"
        icon={<IconAlertCircle size={18} />}
        role="alert"
        variant="light"
      >
        <Text>
          <Trans>The eduMFA API seems to be offline!</Trans>
        </Text>
        <Text>
          <Trans>
            Please try to reload and otherwise contact your system administrator!
          </Trans>
        </Text>
      </Alert>
    </LoginShell>
  );
}
