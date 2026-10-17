import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, PasswordInput, Stack, Text, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function MotpFields({ errors, form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Stack gap={4} mb="sm">
        <Checkbox
          checked={form.genkey}
          id="generate"
          label={<Trans>Generate OTP Key on the Server</Trans>}
          onChange={(event) => {
            onChange({ genkey: event.currentTarget.checked });
          }}
        />
        {form.genkey ? (
          <Text c="dimmed" size="sm">
            <Trans>
              The server will create the secret key and a QR Code will be displayed to
              you to be scanned with the Token2 app.
            </Trans>
          </Text>
        ) : null}
      </Stack>
      {!form.genkey ? (
        <TextInput
          autoComplete="off"
          error={
            errors.includes("otpkey")
              ? t`The OTP key must be a hexadecimal string.`
              : undefined
          }
          id="otpkey"
          label={<Trans>OTP Key</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ otpkey: event.currentTarget.value });
          }}
          placeholder={t`Enter OTP key...`}
          value={form.otpkey}
        />
      ) : null}
      <PasswordInput
        autoComplete="new-password"
        description={
          <Trans>
            The mOTP PIN is the PIN that needs to be entered on the mobile device.
          </Trans>
        }
        id="motppin"
        label={<Trans>mOTP PIN</Trans>}
        mb="xs"
        onChange={(event) => {
          onChange({ motpPin: event.currentTarget.value });
        }}
        placeholder={t`Type a password`}
        value={form.motpPin}
      />
      <PasswordInput
        aria-label={t`Repeat password`}
        autoComplete="new-password"
        error={
          errors.includes("motpPin") && form.motpPinRepeat !== ""
            ? t`The PINs do not match.`
            : undefined
        }
        id="motppin2"
        mb="sm"
        onChange={(event) => {
          onChange({ motpPinRepeat: event.currentTarget.value });
        }}
        placeholder={t`Repeat password`}
        value={form.motpPinRepeat}
      />
    </>
  );
}
