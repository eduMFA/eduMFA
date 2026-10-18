import { useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, Stack, Text, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function ApplSpecFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();
  const serviceOptions = [
    { label: "", value: "" },
    ...Object.entries(lookups.serviceIds).map(([name, service]) => ({
      label: `${name}: ${service.description ?? ""}`,
      value: name
    }))
  ];

  return (
    <>
      <SectionTitle>{t`Token data`}</SectionTitle>
      <Stack gap={4} mb="sm">
        <Checkbox
          checked={form.genkey}
          id="generate"
          label={t`Generate the static password on the Server`}
          onChange={(event) => {
            onChange({ genkey: event.currentTarget.checked });
          }}
        />
        {form.genkey ? (
          <Text c="dimmed" size="sm">
            {t`The server will create the static password.`}
          </Text>
        ) : null}
      </Stack>
      {!form.genkey ? (
        <TextInput
          autoComplete="off"
          id="otpkey"
          label={t`Application specific password`}
          mb="sm"
          onChange={(event) => {
            onChange({ otpkey: event.currentTarget.value });
          }}
          placeholder={t`Enter static password...`}
          value={form.otpkey}
        />
      ) : null}
      <NativeSelect
        data={serviceOptions}
        id="service_id"
        label={t`Service ID`}
        mb="sm"
        onChange={(event) => {
          onChange({ serviceId: event.currentTarget.value });
        }}
        required
        value={form.serviceId}
      />
    </>
  );
}
