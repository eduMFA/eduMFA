import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Grid, Text } from "@mantine/core";

import { type EnrolledTokenResultProps } from "./types";

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
        {t`Please note, that your smartphone needs internet access during the authentication process.`}
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
          {t`It will send the missing registration data to the configured endpoint.`}
        </Text>
      </Grid.Col>
    </Grid>
  );
}
