import { useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function RemoteFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();
  const serverOptions = [
    { label: "", value: "" },
    ...Object.entries(lookups.eduMfaServers).map(([identifier, server]) => ({
      label: identifier,
      value: String(server.id)
    }))
  ];

  return (
    <>
      <SectionTitle>{t`Token data`}</SectionTitle>
      <Checkbox
        checked={form.remoteLocalCheckPin}
        id="localPin"
        label={t`Check the PIN locally`}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteLocalCheckPin: event.currentTarget.checked });
        }}
      />
      <NativeSelect
        data={serverOptions}
        id="remoteServer"
        label={t`Remote Server`}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteServerId: event.currentTarget.value });
        }}
        required
        value={form.remoteServerId}
      />
      <TextInput
        id="remoteSerial"
        label={t`Remote Serial`}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteSerial: event.currentTarget.value });
        }}
        placeholder={t`The serial number on the remote server`}
        value={form.remoteSerial}
      />
      <TextInput
        id="remoteUser"
        label={t`Remote User`}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteUser: event.currentTarget.value });
        }}
        placeholder={t`The username on the remote server`}
        value={form.remoteUser}
      />
      <TextInput
        id="remoteRealm"
        label={t`Remote Realm`}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteRealm: event.currentTarget.value });
        }}
        value={form.remoteRealm}
      />
      <TextInput
        id="remoteResolver"
        label={t`Remote Resolver`}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteResolver: event.currentTarget.value });
        }}
        value={form.remoteResolver}
      />
    </>
  );
}
