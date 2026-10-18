import { Trans, useLingui } from "@lingui/react/macro";
import { Accordion, Anchor, Grid, Stack, Text } from "@mantine/core";

import { type EnrolledTokenResultProps } from "./types";

export function TiqrResult({ detail }: EnrolledTokenResultProps) {
  const { t } = useLingui();

  return (
    <Grid>
      {detail.tiqrenroll?.img ? (
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <img alt={t`QR code of the token`} src={detail.tiqrenroll.img} width={250} />
        </Grid.Col>
      ) : null}
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Stack gap="sm">
          <Accordion variant="separated">
            <Accordion.Item value="url">
              <Accordion.Control>
                <Trans>The Enrollment URL</Trans>
              </Accordion.Control>
              <Accordion.Panel>
                <Text ff="monospace" size="sm" style={{ wordBreak: "break-all" }}>
                  {detail.tiqrenroll?.value ?? ""}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          {detail.tiqrenroll?.value ? (
            <Text size="sm">
              <Trans>
                Click{" "}
                <Anchor href={detail.tiqrenroll.value} inherit>
                  here
                </Anchor>{" "}
                or scan the QR Code, if you want to add the Token to your TiQR App.
              </Trans>
            </Text>
          ) : null}
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
