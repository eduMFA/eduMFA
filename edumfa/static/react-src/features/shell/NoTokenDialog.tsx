import { Trans } from "@lingui/react/macro";
import { Button, Group, Modal, Text } from "@mantine/core";

export interface NoTokenDialogProps {
  onClose: () => void;
  opened: boolean;
}

/** Port of `dialog.no.token.html`: greets a user who owns no token yet (`dialog_no_token` policy). */
export function NoTokenDialog({ onClose, opened }: NoTokenDialogProps) {
  return (
    <Modal
      centered
      closeOnClickOutside={false}
      onClose={onClose}
      opened={opened}
      title={<Trans>Welcome</Trans>}
      withCloseButton={false}
    >
      <Text size="sm">
        <Trans>
          eduMFA is a system to manage your tokens. You currently have no token
          assigned. You can manage your own tokens here - you can create new tokens, set
          the PIN of the tokens, disable tokens or even delete tokens.
        </Trans>
      </Text>
      <Group justify="flex-end" mt="lg">
        <Button data-autofocus onClick={onClose}>
          <Trans>OK</Trans>
        </Button>
      </Group>
    </Modal>
  );
}
