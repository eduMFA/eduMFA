import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, NumberInput, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { hashHref } from "@/lib/hashbang";

export function RadiusFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Checkbox
        checked={form.radiusLocalCheckPin}
        id="localPin"
        label={<Trans>Check the PIN locally</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ radiusLocalCheckPin: event.currentTarget.checked });
        }}
      />
      {form.radiusLocalCheckPin ? (
        <NumberInput
          description={
            <Trans>
              If the PIN is split and verified locally, you need to define, how long the
              password is, that is sent to the RADIUS server.
            </Trans>
          }
          id="otplen"
          label={<Trans>OTP Length</Trans>}
          mb="sm"
          min={1}
          onChange={(value) => {
            onChange({ otplen: typeof value === "number" ? value : 0 });
          }}
          value={form.otplen}
        />
      ) : null}
      <NativeSelect
        data={["", ...lookups.radiusNames]}
        description={
          <Trans>
            Select a predefined{" "}
            <a href={hashHref("/config/radius")}>RADIUS server configuration</a>. The
            RADIUS request will be forwarded to this RADIUS server.
          </Trans>
        }
        id="identifier"
        label={<Trans>RADIUS server configuration</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ radiusIdentifier: event.currentTarget.value });
        }}
        value={form.radiusIdentifier}
      />
      <TextInput
        description={
          <Trans>
            This is the username that is sent to the RADIUS server. It can be different
            from the owner of this RADIUS token.
          </Trans>
        }
        id="radiusUser"
        label={<Trans>RADIUS User</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ radiusUser: event.currentTarget.value });
        }}
        placeholder={t`The username on the RADIUS server`}
        required
        value={form.radiusUser}
      />
    </>
  );
}

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
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Checkbox
        checked={form.remoteLocalCheckPin}
        id="localPin"
        label={<Trans>Check the PIN locally</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteLocalCheckPin: event.currentTarget.checked });
        }}
      />
      <NativeSelect
        data={serverOptions}
        id="remoteServer"
        label={<Trans>Remote Server</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteServerId: event.currentTarget.value });
        }}
        required
        value={form.remoteServerId}
      />
      <TextInput
        id="remoteSerial"
        label={<Trans>Remote Serial</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteSerial: event.currentTarget.value });
        }}
        placeholder={t`The serial number on the remote server`}
        value={form.remoteSerial}
      />
      <TextInput
        id="remoteUser"
        label={<Trans>Remote User</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteUser: event.currentTarget.value });
        }}
        placeholder={t`The username on the remote server`}
        value={form.remoteUser}
      />
      <TextInput
        id="remoteRealm"
        label={<Trans>Remote Realm</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteRealm: event.currentTarget.value });
        }}
        value={form.remoteRealm}
      />
      <TextInput
        id="remoteResolver"
        label={<Trans>Remote Resolver</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ remoteResolver: event.currentTarget.value });
        }}
        value={form.remoteResolver}
      />
    </>
  );
}
