import { Trans, useLingui } from "@lingui/react/macro";
import { Accordion, Grid, Stack, Text } from "@mantine/core";

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

export function ApplSpecResult({ detail, qrCodeWidth }: EnrolledTokenResultProps) {
  const { t } = useLingui();

  return (
    <Grid>
      {detail.otpkey?.img ? (
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <img
            alt={t`QR code of the password`}
            src={detail.otpkey.img}
            width={qrCodeWidth}
          />
        </Grid.Col>
      ) : null}
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Text size="sm">
          <Trans>Your Password:</Trans>{" "}
          <Text component="b" data-field="password" ff="monospace">
            {detail.password ?? ""}
          </Text>
        </Text>
      </Grid.Col>
    </Grid>
  );
}
