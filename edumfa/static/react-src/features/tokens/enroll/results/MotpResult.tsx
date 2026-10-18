import { Trans, useLingui } from "@lingui/react/macro";
import { Accordion, Anchor, Grid, Stack, Text } from "@mantine/core";

import { stripSeedPrefix } from "./shared";
import { type EnrolledTokenResultProps } from "./types";

export function MotpResult({ detail }: EnrolledTokenResultProps) {
  const { t } = useLingui();

  return (
    <Grid>
      {detail.motpurl?.img ? (
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <img alt={t`QR code of the token`} src={detail.motpurl.img} width={250} />
        </Grid.Col>
      ) : null}
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Stack gap="sm">
          <Accordion variant="separated">
            <Accordion.Item value="seed">
              <Accordion.Control>{t`The OTP key`}</Accordion.Control>
              <Accordion.Panel>
                <Text ff="monospace" size="sm" style={{ wordBreak: "break-all" }}>
                  {stripSeedPrefix(detail.otpkey?.value)}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          {detail.motpurl?.value ? (
            <Text size="sm">
              <Trans>
                Click{" "}
                <Anchor href={detail.motpurl.value} inherit>
                  here
                </Anchor>{" "}
                or scan the QR Code, if you want to add the Token to your mOTP App like
                Token2.
              </Trans>
            </Text>
          ) : null}
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
