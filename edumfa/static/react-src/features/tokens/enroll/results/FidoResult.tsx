import { Trans } from "@lingui/react/macro";
import { Grid, Stack, Text, Title } from "@mantine/core";

import { type EnrolledTokenResultProps } from "./types";

/** Vendor logos shown next to a registered FIDO authenticator. */
const fidoVendorImages: Record<string, string> = {
  "Plug-up": "static/img/plugup.jpg",
  Solokeys: "static/img/solokeys.png",
  Yubico: "static/img/FIDO-U2F-Security-Key-444x444.png",
  "u2fzero.com": "static/img/u2fzero.png"
};

export function FidoResult({ fido, form }: EnrolledTokenResultProps) {
  const vendor = fido.subject.split(" ")[0] ?? "";
  const vendorImage = fidoVendorImages[vendor];

  return (
    <Stack gap="sm">
      <Title order={4} size="h6">
        {fido.pending ? (
          form.type === "u2f" ? (
            <Trans>Take action on your token</Trans>
          ) : (
            <Trans>Take action on your authenticator</Trans>
          )
        ) : (
          <Trans>Token enrolled</Trans>
        )}
      </Title>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          {vendorImage ? <img alt={vendor} src={vendorImage} width={80} /> : null}
          <Text data-field="fidoSubject" size="sm">
            {fido.subject}
          </Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 8 }}>
          <Text size="sm">
            {fido.pending ? (
              form.type === "u2f" ? (
                <Trans>
                  You need to confirm the registration with your token either by pushing
                  the blinking button or by replugging your token. This depends on the
                  actual token model.
                </Trans>
              ) : (
                <Trans>
                  You need to confirm the registration with your authenticator. For an
                  external authenticator, this usually means pushing the button on the
                  authenticator, or replugging it (if there is no button on the
                  authenticator). If you want to use an authenticator that is integrated
                  into your device, look for a dialog box from your operating system. If
                  you do not see anything, please make sure that your authenticator
                  supports WebAuthn.
                </Trans>
              )
            ) : (
              <Trans>The token is enrolled.</Trans>
            )}
          </Text>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
