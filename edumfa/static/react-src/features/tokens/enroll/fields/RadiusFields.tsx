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
