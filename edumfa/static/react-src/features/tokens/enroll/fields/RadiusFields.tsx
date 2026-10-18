import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, NumberInput, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { hashHref } from "@/lib/hashbang";

export function RadiusFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>{t`Token data`}</SectionTitle>
      <Checkbox
        checked={form.radiusLocalCheckPin}
        id="localPin"
        label={t`Check the PIN locally`}
        mb="sm"
        onChange={(event) => {
          onChange({ radiusLocalCheckPin: event.currentTarget.checked });
        }}
      />
      {form.radiusLocalCheckPin ? (
        <NumberInput
          description={t`If the PIN is split and verified locally, you need to define, how long the password is, that is sent to the RADIUS server.`}
          id="otplen"
          label={t`OTP Length`}
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
        label={t`RADIUS server configuration`}
        mb="sm"
        onChange={(event) => {
          onChange({ radiusIdentifier: event.currentTarget.value });
        }}
        value={form.radiusIdentifier}
      />
      <TextInput
        description={t`This is the username that is sent to the RADIUS server. It can be different from the owner of this RADIUS token.`}
        id="radiusUser"
        label={t`RADIUS User`}
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
