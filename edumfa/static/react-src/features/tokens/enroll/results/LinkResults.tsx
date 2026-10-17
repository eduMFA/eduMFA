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
              <Accordion.Control>
                <Trans>The OTP key</Trans>
              </Accordion.Control>
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

export function PushResult({
  detail,
  form,
  isWizard,
  qrCodeWidth,
  rolloutState
}: EnrolledTokenResultProps) {
  const { t } = useLingui();
  const serial = detail.serial;

  if (rolloutState === "enrolled") {
    return (
      <Text size="sm" ta={isWizard ? "center" : undefined}>
        <Trans>
          Please note, that your smartphone needs internet access during the
          authentication process.
        </Trans>
      </Text>
    );
  }

  if (rolloutState !== "clientwait") {
    return null;
  }

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Text c="dimmed" mb="sm" size="sm">
          {form.type === "edupush" ? (
            <Trans>
              Please scan the QR code with the eduMFA Authenticator App or click{" "}
              <Anchor href={detail.pushurl?.value ?? "#"} inherit>
                this link
              </Anchor>{" "}
              on your smartphone.
            </Trans>
          ) : (
            <Trans>
              Please scan the QR code with the privacyIDEA Authenticator App or click{" "}
              <Anchor href={detail.pushurl?.value ?? "#"} inherit>
                this link
              </Anchor>{" "}
              on your smartphone.
            </Trans>
          )}
        </Text>
        {detail.pushurl?.img ? (
          <img
            alt={t`QR code of the token`}
            src={detail.pushurl.img}
            width={qrCodeWidth}
          />
        ) : null}
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Text size="sm">
          <Trans>Your token {serial} is not completely enrolled, yet.</Trans>
        </Text>
        <Text size="sm">
          <Trans>
            It will send the missing registration data to the configured endpoint.
          </Trans>
        </Text>
      </Grid.Col>
    </Grid>
  );
}
