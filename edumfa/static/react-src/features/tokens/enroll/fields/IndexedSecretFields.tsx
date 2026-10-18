import { Trans, useLingui } from "@lingui/react/macro";
import { Text, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function IndexedSecretFields({
  form,
  indexedSecretForced,
  onChange
}: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      {indexedSecretForced ? (
        <Text c="dimmed" mb="sm" size="sm">
          <Trans>The value of the indexed secret will be set by a policy.</Trans>
        </Text>
      ) : (
        <TextInput
          autoComplete="off"
          id="otpkey"
          label={<Trans>Secret</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ otpkey: event.currentTarget.value });
          }}
          placeholder={t`Your secret phrase.`}
          value={form.otpkey}
        />
      )}
    </>
  );
}
