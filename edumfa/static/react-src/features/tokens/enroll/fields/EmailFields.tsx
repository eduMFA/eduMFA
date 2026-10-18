import { useLingui } from "@lingui/react/macro";
import { Checkbox, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function EmailFields({ form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>{t`Token data`}</SectionTitle>
      <Checkbox
        checked={form.dynamicEmail}
        id="dynamic_email"
        label={t`Read email address dynamically from user source on each request.`}
        mb="sm"
        onChange={(event) => {
          onChange({ dynamicEmail: event.currentTarget.checked });
        }}
      />
      {!form.dynamicEmail ? (
        <TextInput
          id="email"
          label={t`Email Address`}
          mb="sm"
          onChange={(event) => {
            onChange({ email: event.currentTarget.value });
          }}
          placeholder={t`Users email address...`}
          required
          type="email"
          value={form.email}
        />
      ) : null}
    </>
  );
}
