import { Trans } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import { IconEdit, IconLogout } from "@tabler/icons-react";

import { useAuth } from "@/auth/AuthProvider";

export interface EnrolledTokenActionsProps {
  isWizard: boolean;
  onEnrollAnother: () => void;
}

/** What follows a finished enrollment: another token, or the wizard's logout. */
export function EnrolledTokenActions({
  isWizard,
  onEnrollAnother
}: EnrolledTokenActionsProps) {
  const { logout } = useAuth();

  return (
    <Group justify="center">
      {isWizard ? (
        <Button
          id="wizardLogoutButton"
          leftSection={<IconLogout size={16} />}
          onClick={() => {
            logout();
          }}
        >
          <Trans>Logout</Trans>
        </Button>
      ) : (
        <Button
          id="enrollAnotherButton"
          leftSection={<IconEdit size={16} />}
          onClick={onEnrollAnother}
        >
          <Trans>Enroll a new token</Trans>
        </Button>
      )}
    </Group>
  );
}
