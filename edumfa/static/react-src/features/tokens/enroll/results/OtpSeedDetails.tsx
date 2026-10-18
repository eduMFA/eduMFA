import { Trans } from "@lingui/react/macro";
import { Accordion, Anchor, Button, Group, Stack, Text } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

import { stripSeedPrefix } from "./shared";
import { type EnrolledTokenResultProps } from "./types";

export type OtpSeedDetailsProps = Pick<
  EnrolledTokenResultProps,
  "detail" | "isWizard" | "onRegenerate" | "showSeed"
>;

/** The seed in hex and base32, the enrollment link and the regenerate hint. */
export function OtpSeedDetails({
  detail,
  isWizard,
  onRegenerate,
  showSeed
}: OtpSeedDetailsProps) {
  return (
    <Stack gap="sm">
      {showSeed ? (
        <Accordion variant="separated">
          <Accordion.Item value="seed">
            <Accordion.Control>
              <Trans>The OTP key</Trans>
            </Accordion.Control>
            <Accordion.Panel>
              <Text ff="monospace" size="sm" style={{ wordBreak: "break-all" }}>
                Hex: {stripSeedPrefix(detail.otpkey?.value)}
              </Text>
              <Text ff="monospace" size="sm" style={{ wordBreak: "break-all" }}>
                Base32: {detail.otpkey?.value_b32 ?? ""}
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      ) : null}
      {!isWizard ? (
        <>
          {detail.googleurl?.value ? (
            <Text size="sm">
              <Trans>
                Click{" "}
                <Anchor href={detail.googleurl.value} inherit>
                  here
                </Anchor>{" "}
                or scan the QR Code, if you want to add the Token to your smartphone
                authenticator app.
              </Trans>
            </Text>
          ) : null}
          <Text size="sm">
            <Trans>
              The QR Code contains the secret key of your token. You need to protect it.{" "}
              <b>
                If you are in doubt, that someone else saw it, please regenerate the QR
                Code, when no one else is watching.
              </b>
            </Trans>
          </Text>
          <Group>
            <Button
              color="yellow"
              leftSection={<IconRefresh size={16} />}
              onClick={onRegenerate}
              variant="light"
            >
              <Trans>Regenerate QR Code</Trans>
            </Button>
          </Group>
        </>
      ) : null}
    </Stack>
  );
}
