import { useLingui } from "@lingui/react/macro";
import { Checkbox, TextInput, Textarea } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { getVascoSerial } from "@/features/tokens/enroll/enrollForm";

export function VascoFields({ errors, form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();
  const vascoSerial = getVascoSerial(form.otpkey);

  return (
    <>
      <SectionTitle>{t`Token data`}</SectionTitle>
      <Textarea
        autosize
        error={
          errors.includes("otpkey")
            ? t`The blob must be a hexadecimal string.`
            : undefined
        }
        id="otpkey"
        label={t`VASCO Token blob`}
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
        label={t`use VASCO Serial`}
        mb="xs"
        onChange={(event) => {
          onChange({ useVascoSerial: event.currentTarget.checked });
        }}
      />
      <TextInput
        aria-label={t`VASCO serial`}
        description={t`The VASCO serial is read from the VASCO blob. If you want to use this VASCO serial number within eduMFA, activate the checkbox. Otherwise eduMFA will create a new unique serial number.`}
        disabled
        id="serial"
        mb="sm"
        value={vascoSerial}
      />
    </>
  );
}
