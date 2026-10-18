import { useLingui } from "@lingui/react/macro";
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
      <SectionTitle>{t`Token data`}</SectionTitle>
      {indexedSecretForced ? (
        <Text c="dimmed" mb="sm" size="sm">
          {t`The value of the indexed secret will be set by a policy.`}
        </Text>
      ) : (
        <TextInput
          autoComplete="off"
          id="otpkey"
          label={t`Secret`}
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
