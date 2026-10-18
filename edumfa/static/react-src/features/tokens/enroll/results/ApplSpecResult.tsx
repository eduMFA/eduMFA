import { Trans, useLingui } from "@lingui/react/macro";
import { Grid, Text } from "@mantine/core";

import { type EnrolledTokenResultProps } from "./types";

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
