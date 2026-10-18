import { Grid, Stack, Text, Title } from "@mantine/core";

import { FidoResultDescription } from "./FidoResultDescription";
import { FidoResultTitle } from "./FidoResultTitle";
import { getFidoStage } from "./fidoStage";
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
  const stage = getFidoStage(fido.pending, form.type);

  return (
    <Stack gap="sm">
      <Title order={4} size="h6">
        <FidoResultTitle stage={stage} />
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
            <FidoResultDescription stage={stage} />
          </Text>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
