import { useLingui } from "@lingui/react/macro";
import { Accordion, Stack, Text } from "@mantine/core";

import { type EnrolledTokenResultProps } from "./types";

export function RegistrationResult({ detail }: EnrolledTokenResultProps) {
  const { t } = useLingui();

  return (
    <Stack gap="sm">
      <Accordion variant="separated">
        <Accordion.Item value="code">
          <Accordion.Control>{t`Registration Code`}</Accordion.Control>
          <Accordion.Panel>
            <Text data-field="registrationcode" ff="monospace" size="sm">
              {detail.registrationcode ?? ""}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <Text c="dimmed" size="sm">
        {t`You may pass this registration code to the user.`}
      </Text>
    </Stack>
  );
}
