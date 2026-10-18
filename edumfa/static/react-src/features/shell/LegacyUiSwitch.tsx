import { useLingui } from "@lingui/react/macro";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconSwitchHorizontal } from "@tabler/icons-react";

import { clearSession } from "@/auth/sessionStore";

/** Opens the legacy Angular UI; the React session is dropped on the way. */
export function LegacyUiSwitch() {
  const { t } = useLingui();

  return (
    <Tooltip label={t`Switch to legacy UI`}>
      <ActionIcon
        aria-label={t`Switch to legacy UI`}
        className="ui-switch-button"
        component="a"
        href="?ui=legacy"
        onClick={clearSession}
        size="lg"
        variant="subtle"
      >
        <IconSwitchHorizontal aria-hidden size={18} />
      </ActionIcon>
    </Tooltip>
  );
}
