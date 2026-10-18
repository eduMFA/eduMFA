import { Trans, useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

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
