import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, NumberInput, TextInput, Textarea } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { getVascoSerial } from "@/features/tokens/enroll/enrollForm";

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

export function YubicoFields({ form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <TextInput
        id="yubicoID"
        label={<Trans>Yubikey Identifier</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ yubicoTokenId: event.currentTarget.value });
        }}
        placeholder={t`Enter the 12 digit Yubikey identifier...`}
        required
        value={form.yubicoTokenId}
      />
    </>
  );
}

export function VascoFields({ errors, form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();
  const vascoSerial = getVascoSerial(form.otpkey);

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Textarea
        autosize
        error={
          errors.includes("otpkey")
            ? t`The blob must be a hexadecimal string.`
            : undefined
        }
        id="otpkey"
        label={<Trans>VASCO Token blob</Trans>}
        mb="sm"
        minRows={5}
        onChange={(event) => {
          onChange({ otpkey: event.currentTarget.value });
        }}
        placeholder="blob..."
        value={form.otpkey}
      />
      <Checkbox
        checked={form.useVascoSerial}
        id="useVascoSerial"
        label={<Trans>use VASCO Serial</Trans>}
        mb="xs"
        onChange={(event) => {
          onChange({ useVascoSerial: event.currentTarget.checked });
        }}
      />
      <TextInput
        aria-label={t`VASCO serial`}
        description={
          <Trans>
            The VASCO serial is read from the VASCO blob. If you want to use this VASCO
            serial number within eduMFA, activate the checkbox. Otherwise eduMFA will
            create a new unique serial number.
          </Trans>
        }
        disabled
        id="serial"
        mb="sm"
        value={vascoSerial}
      />
    </>
  );
}
