import { useLingui } from "@lingui/react/macro";
import { Checkbox, PasswordInput, Stack, Text, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function MotpFields({ errors, form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>{t`Token data`}</SectionTitle>
      <Stack gap={4} mb="sm">
        <Checkbox
          checked={form.genkey}
          id="generate"
          label={t`Generate OTP Key on the Server`}
          onChange={(event) => {
            onChange({ genkey: event.currentTarget.checked });
          }}
        />
        {form.genkey ? (
          <Text c="dimmed" size="sm">
            {t`The server will create the secret key and a QR Code will be displayed to you to be scanned with the Token2 app.`}
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
          label={t`OTP Key`}
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
        description={t`The mOTP PIN is the PIN that needs to be entered on the mobile device.`}
        id="motppin"
        label={t`mOTP PIN`}
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
