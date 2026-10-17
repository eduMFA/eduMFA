import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Group, Modal, Text, Title } from "@mantine/core";

export interface AboutDialogProps {
  onClose: () => void;
  opened: boolean;
}

/** Port of `dialog.about.html`. */
export function AboutDialog({ onClose, opened }: AboutDialogProps) {
  return (
    <Modal
      centered
      onClose={onClose}
      opened={opened}
      title={<Trans>About eduMFA Web Client</Trans>}
    >
      <Title mb="xs" order={3} size="h5">
        <Trans>eduMFA Single Page Web Client</Trans>
      </Title>
      <Text mb="sm" size="sm">
        <Trans>
          This is a Single Page Application client that acts as a frontend for the
          eduMFA authentication backend.
        </Trans>
      </Text>
      <Text mb="md" size="sm">
        <Trans>Licensed under</Trans>{" "}
        <Anchor
          href="http://www.gnu.org/licenses/agpl-3.0.en.html"
          rel="noopener"
          target="_blank"
        >
          AGPLv3
        </Anchor>
        .<br />
        <Trans>
          eduMFA, including this client, was forked from privacyIDEA, which was licensed
          by NetKnights GmbH.
        </Trans>
      </Text>
      <Title mb="xs" order={3} size="h5">
        <Trans>eduMFA authentication backend</Trans>
      </Title>
      <Text mb="md" size="sm">
        <Trans>
          The eduMFA authentication backend is licensed under the AGPLv3. Some
          components may be part to other licenses. eduMFA was forked from privacyIDEA,
          which was licensed by NetKnights GmbH. Prior to this, privacyIDEA was
          originally forked from LinOTP, which was licensed by LSE Leading Security
          Experts GmbH. For detailed information please take a look at the{" "}
          <Anchor
            href="https://github.com/eduMFA/eduMFA"
            rel="noopener"
            target="_blank"
          >
            backend service itself
          </Anchor>
          .
        </Trans>
      </Text>
      <Group justify="flex-end">
        <Button onClick={onClose} variant="default">
          <Trans>Close</Trans>
        </Button>
      </Group>
    </Modal>
  );
}
