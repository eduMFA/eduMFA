import { Trans } from "@lingui/react/macro";
import { Button, Text, TextInput } from "@mantine/core";

import { type EnrolledTokenResultProps } from "./types";

export interface OtpClientPartFieldsProps extends Pick<
  EnrolledTokenResultProps,
  "clientPart" | "isSendingClientPart" | "onClientPartChange" | "onSendClientPart"
> {
  serial: string;
}

/** Second step of a two-step enrollment: the client part typed from the app. */
export function OtpClientPartFields({
  clientPart,
  isSendingClientPart,
  onClientPartChange,
  onSendClientPart,
  serial
}: OtpClientPartFieldsProps) {
  return (
    <>
      <Text size="sm">
        <Trans>Your token {serial} is not completely enrolled, yet.</Trans>
      </Text>
      <Text mb="sm" size="sm">
        <Trans>
          Please scan the QR code with the privacyIDEA Authenticator app and enter the
          generated code below.
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
    </>
  );
}
