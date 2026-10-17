import { Trans } from "@lingui/react/macro";
import { Anchor, Checkbox, Stack, TextInput } from "@mantine/core";

import type { SystemConfigCardProps } from "./systemConfigForm";
import { Card } from "@/components/layout/Card";
import { useDocsUrl } from "@/lib/docs";

/**
 * The authentication switches of `config.system.edit.html`: username
 * splitting, fail counter handling, PIN position, SAML attributes and the
 * automatic resync.
 */
export function AuthenticationSettingsCard({ form, onChange }: SystemConfigCardProps) {
  const failCounterDocsUrl = useDocsUrl(
    "configuration/system_config.html#clear-failcounter-after-minutes"
  );

  return (
    <Card title={<Trans>Authentication</Trans>}>
      <Stack gap="sm">
        <Checkbox
          checked={form.splitAtSign}
          id="splitAtSign"
          label={<Trans>Use @ sign to split the username and the realm.</Trans>}
          onChange={(event) => {
            onChange({ splitAtSign: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.IncFailCountOnFalsePin}
          id="IncFailCountOnFalsePin"
          label={<Trans>Increase the failcounter if the wrong PIN was entered.</Trans>}
          onChange={(event) => {
            onChange({ IncFailCountOnFalsePin: event.currentTarget.checked });
          }}
        />
        <TextInput
          description={
            <Trans>
              See the{" "}
              <Anchor href={failCounterDocsUrl} inherit rel="noopener" target="_blank">
                documentation
              </Anchor>{" "}
              before using.
            </Trans>
          }
          id="failcounter_clear_timeout"
          inputMode="numeric"
          label={<Trans>Clear failcounter after minutes</Trans>}
          maw={320}
          onChange={(event) => {
            onChange({ failcounter_clear_timeout: event.currentTarget.value });
          }}
          placeholder="0"
          value={form.failcounter_clear_timeout}
        />
        <Checkbox
          checked={form.no_auth_counter}
          id="NoAuthCounter"
          label={<Trans>Do not use an authentication counter per token.</Trans>}
          onChange={(event) => {
            onChange({ no_auth_counter: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.PrependPin}
          id="PrependPin"
          label={
            <Trans>
              Prepend the PIN in front of the OTP value. Otherwise it will be post
              pended.
            </Trans>
          }
          onChange={(event) => {
            onChange({ PrependPin: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.ReturnSamlAttributes}
          id="ReturnSamlAttributes"
          label={<Trans>Include SAML attributes in the authentication response.</Trans>}
          onChange={(event) => {
            onChange({ ReturnSamlAttributes: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.ReturnSamlAttributesOnFail}
          disabled={!form.ReturnSamlAttributes}
          id="ReturnSamlAttributesOnFail"
          label={
            <Trans>
              Include SAML attributes even if the user failed to authenticate.
            </Trans>
          }
          onChange={(event) => {
            onChange({ ReturnSamlAttributesOnFail: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.AutoResync}
          id="AutoResync"
          label={<Trans>Automatic resync during authentication</Trans>}
          onChange={(event) => {
            onChange({ AutoResync: event.currentTarget.checked });
          }}
        />
        <TextInput
          disabled={!form.AutoResync}
          id="AutoResyncTimeout"
          inputMode="numeric"
          label={<Trans>Auto resync timeout</Trans>}
          maw={320}
          onChange={(event) => {
            onChange({ AutoResyncTimeout: event.currentTarget.value });
          }}
          placeholder="300"
          value={form.AutoResyncTimeout}
        />
      </Stack>
    </Card>
  );
}
