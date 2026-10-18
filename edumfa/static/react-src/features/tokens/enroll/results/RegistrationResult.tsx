import { Trans } from "@lingui/react/macro";
import { Accordion, Stack, Text } from "@mantine/core";

import { type EnrolledTokenResultProps } from "./types";

export function RegistrationResult({ detail }: EnrolledTokenResultProps) {
  return (
    <Stack gap="sm">
      <Accordion variant="separated">
        <Accordion.Item value="code">
          <Accordion.Control>
            <Trans>Registration Code</Trans>
          </Accordion.Control>
          <Accordion.Panel>
            <Text data-field="registrationcode" ff="monospace" size="sm">
              {detail.registrationcode ?? ""}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <Text c="dimmed" size="sm">
        <Trans>You may pass this registration code to the user.</Trans>
      </Text>
    </Stack>
  );
}
