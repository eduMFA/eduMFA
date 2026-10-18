import { Trans, useLingui } from "@lingui/react/macro";
import { NumberInput, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function YubikeyFields({ errors, form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <TextInput
        autoComplete="off"
        id="yubikeyTest"
        label={<Trans>Test Yubikey</Trans>}
        mb="sm"
        onChange={(event) => {
          const yubikeyTest = event.currentTarget.value;
          const length = yubikeyTest.trim().length;

          // Port of `yubikeyGetLen`: a test OTP reveals the programmed length.
          onChange({ yubikeyTest, ...(length >= 32 ? { otplen: length } : {}) });
        }}
        placeholder={t`Push Yubikey button here...`}
        value={form.yubikeyTest}
      />
      <TextInput
        autoComplete="off"
        error={
          errors.includes("yubikeyKey") && form.otpkey !== ""
            ? t`The OTP key must be 32 hexadecimal characters.`
            : undefined
        }
        id="otpkey"
        label={<Trans>OTP Key</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ otpkey: event.currentTarget.value });
        }}
        placeholder={t`Enter OTP key...`}
        required
        value={form.otpkey}
      />
      <NumberInput
        error={
          errors.includes("yubikeyOtplen")
            ? t`The OTP length must be between 32 and 99.`
            : undefined
        }
        id="otplen"
        label={<Trans>OTP length</Trans>}
        max={99}
        mb="sm"
        min={32}
        onChange={(value) => {
          onChange({ otplen: typeof value === "number" ? value : 0 });
        }}
        required
        value={form.otplen}
      />
    </>
  );
}
