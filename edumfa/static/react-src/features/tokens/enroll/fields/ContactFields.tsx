import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Checkbox, Group, NativeSelect, Stack, TextInput } from "@mantine/core";
import { IconPhone } from "@tabler/icons-react";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function EmailFields({ form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Checkbox
        checked={form.dynamicEmail}
        id="dynamic_email"
        label={
          <Trans>
            Read email address dynamically from user source on each request.
          </Trans>
        }
        mb="sm"
        onChange={(event) => {
          onChange({ dynamicEmail: event.currentTarget.checked });
        }}
      />
      {!form.dynamicEmail ? (
        <TextInput
          id="email"
          label={<Trans>Email Address</Trans>}
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

export function SmsFields({ errors, form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Checkbox
        checked={form.dynamicPhone}
        id="dynamic_phone"
        label={<Trans>Read number dynamically from user source on each request.</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ dynamicPhone: event.currentTarget.checked });
        }}
      />
      {!form.dynamicPhone ? (
        <Stack gap="xs" mb="sm">
          <TextInput
            error={
              errors.includes("phone") && form.phone !== ""
                ? t`Please enter a valid phone number.`
                : undefined
            }
            id="phone"
            label={<Trans>Phone number</Trans>}
            onChange={(event) => {
              onChange({ phone: event.currentTarget.value });
            }}
            placeholder="+1234567890"
            required
            type="tel"
            value={form.phone}
          />
          {lookups.phones.length > 0 ? (
            <Group gap="xs">
              {lookups.phones.map((phone) => (
                <Button
                  key={phone}
                  leftSection={<IconPhone size={14} />}
                  onClick={() => {
                    onChange({ phone });
                  }}
                  size="xs"
                  variant="default"
                >
                  {phone}
                </Button>
              ))}
            </Group>
          ) : null}
        </Stack>
      ) : null}
      {lookups.smsGateways.length > 0 ? (
        <NativeSelect
          data={["", ...lookups.smsGateways]}
          description={
            <Trans>
              If this token should not use the system wide SMS gateway but an individual
              SMS gateway, you can select the gateway here.
            </Trans>
          }
          id="identifier"
          label={<Trans>A token specific SMS gateway</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ smsIdentifier: event.currentTarget.value });
          }}
          value={form.smsIdentifier}
        />
      ) : null}
    </>
  );
}
