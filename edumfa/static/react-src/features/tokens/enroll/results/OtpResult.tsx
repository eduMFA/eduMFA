import { Trans, useLingui } from "@lingui/react/macro";
import {
  Accordion,
  Anchor,
  Button,
  Grid,
  Group,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

import { stripSeedPrefix } from "./shared";
import { type EnrolledTokenResultProps } from "./types";

export function OtpResult({
  clientPart,
  detail,
  form,
  isSendingClientPart,
  isWizard,
  onClientPartChange,
  onRegenerate,
  onSendClientPart,
  qrCodeWidth,
  rolloutState,
  showSeed
}: EnrolledTokenResultProps) {
  const { t } = useLingui();
  const twoStep = form.twoStepInit;
  const isClientWait = rolloutState === "clientwait";
  const showQrCode = !(twoStep && !isClientWait);
  const fullWidth = isWizard && !twoStep;
  const columnSpan = { base: 12, sm: fullWidth ? 12 : 6 };
  const serial = detail.serial;

  return (
    <Grid>
      {showQrCode && detail.googleurl?.img ? (
        <Grid.Col span={columnSpan} ta={fullWidth ? "center" : undefined}>
          <img
            alt={t`QR code of the token`}
            src={detail.googleurl.img}
            width={qrCodeWidth}
          />
        </Grid.Col>
      ) : null}
      {!twoStep ? (
        <Grid.Col span={columnSpan}>
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
                      or scan the QR Code, if you want to add the Token to your
                      smartphone authenticator app.
                    </Trans>
                  </Text>
                ) : null}
                <Text size="sm">
                  <Trans>
                    The QR Code contains the secret key of your token. You need to
                    protect it.{" "}
                    <b>
                      If you are in doubt, that someone else saw it, please regenerate
                      the QR Code, when no one else is watching.
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
        </Grid.Col>
      ) : null}
      {twoStep && isClientWait ? (
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Text size="sm">
            <Trans>Your token {serial} is not completely enrolled, yet.</Trans>
          </Text>
          <Text mb="sm" size="sm">
            <Trans>
              Please scan the QR code with the privacyIDEA Authenticator app and enter
              the generated code below.
            </Trans>
          </Text>
          <TextInput
            autoComplete="off"
            id="clientpart"
            label={<Trans>Client Part</Trans>}
            mb="sm"
            onChange={(event) => {
              onClientPartChange(event.currentTarget.value);
            }}
            value={clientPart}
          />
          <Button
            disabled={clientPart.trim() === ""}
            loading={isSendingClientPart}
            onClick={onSendClientPart}
          >
            <Trans>Enroll Token</Trans>
          </Button>
        </Grid.Col>
      ) : null}
    </Grid>
  );
}
