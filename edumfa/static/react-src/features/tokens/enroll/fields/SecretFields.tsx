import { Trans, useLingui } from "@lingui/react/macro";
import {
  Checkbox,
  NativeSelect,
  Stack,
  Text,
  TextInput,
  Textarea
} from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { getSshKeyComment } from "@/features/tokens/enroll/enrollForm";

export function SshKeyFields({ form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Textarea
        autosize
        id="sshkey"
        label={<Trans>SSH public Key</Trans>}
        mb="sm"
        minRows={5}
        onChange={(event) => {
          const sshkey = event.currentTarget.value;

          onChange({ description: getSshKeyComment(sshkey), sshkey });
        }}
        placeholder={t`Paste the ssh PUBLIC key`}
        value={form.sshkey}
      />
    </>
  );
}

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
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Stack gap={4} mb="sm">
        <Checkbox
          checked={form.genkey}
          id="generate"
          label={<Trans>Generate the static password on the Server</Trans>}
          onChange={(event) => {
            onChange({ genkey: event.currentTarget.checked });
          }}
        />
        {form.genkey ? (
          <Text c="dimmed" size="sm">
            <Trans>The server will create the static password.</Trans>
          </Text>
        ) : null}
      </Stack>
      {!form.genkey ? (
        <TextInput
          autoComplete="off"
          id="otpkey"
          label={<Trans>Application specific password</Trans>}
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
        label={<Trans>Service ID</Trans>}
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
