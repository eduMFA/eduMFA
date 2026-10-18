import { useLingui } from "@lingui/react/macro";
import { Alert, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import { LoginShell } from "./LoginShell";

/** Port of `offline.html`: shown when the API cannot be reached. */
export function OfflinePage() {
  const { t } = useLingui();

  return (
    <LoginShell>
      <Alert
        color="red"
        icon={<IconAlertCircle size={18} />}
        role="alert"
        variant="light"
      >
        <Text>{t`The eduMFA API seems to be offline!`}</Text>
        <Text>
          {t`Please try to reload and otherwise contact your system administrator!`}
        </Text>
      </Alert>
    </LoginShell>
  );
}
