import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy, IconPlugConnected } from "@tabler/icons-react";

export interface LdapMachineResolverActionsProps {
  /** Saving needs `mresolverwrite`; the test stays available without it. */
  canSave: boolean;
  isSaving: boolean;
  isTesting: boolean;
  isValid: boolean;
  onTest: () => void;
}

/** The footer of the LDAP machine resolver editor: the connection test and the save. */
export function LdapMachineResolverActions({
  canSave,
  isSaving,
  isTesting,
  isValid,
  onTest
}: LdapMachineResolverActionsProps) {
  return (
    <>
      <Button
        color="green"
        disabled={!isValid}
        leftSection={<IconPlugConnected size={16} />}
        loading={isTesting}
        onClick={onTest}
        type="button"
        variant="light"
      >
        <Trans>Test LDAP Resolver</Trans>
      </Button>
      {canSave ? (
        <Button
          disabled={!isValid}
          leftSection={<IconDeviceFloppy size={16} />}
          loading={isSaving}
          type="submit"
        >
          <Trans>Save resolver</Trans>
        </Button>
      ) : null}
    </>
  );
}
