import { useLingui } from "@lingui/react/macro";
import { Grid } from "@mantine/core";

import { OtpClientPartFields } from "./OtpClientPartFields";
import { OtpSeedDetails } from "./OtpSeedDetails";
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
          <OtpSeedDetails
            detail={detail}
            isWizard={isWizard}
            onRegenerate={onRegenerate}
            showSeed={showSeed}
          />
        </Grid.Col>
      ) : null}
      {twoStep && isClientWait ? (
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <OtpClientPartFields
            clientPart={clientPart}
            isSendingClientPart={isSendingClientPart}
            onClientPartChange={onClientPartChange}
            onSendClientPart={onSendClientPart}
            serial={detail.serial}
          />
        </Grid.Col>
      ) : null}
    </Grid>
  );
}
