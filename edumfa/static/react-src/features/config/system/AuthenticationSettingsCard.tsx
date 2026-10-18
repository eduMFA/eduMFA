import { Trans, useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  const failCounterDocsUrl = useDocsUrl(
    "configuration/system_config.html#clear-failcounter-after-minutes"
  );

  return (
    <Card title={t`Authentication`}>
      <Stack gap="sm">
        <Checkbox
          checked={form.splitAtSign}
          id="splitAtSign"
          label={t`Use @ sign to split the username and the realm.`}
          onChange={(event) => {
            onChange({ splitAtSign: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.IncFailCountOnFalsePin}
          id="IncFailCountOnFalsePin"
          label={t`Increase the failcounter if the wrong PIN was entered.`}
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
          label={t`Clear failcounter after minutes`}
          onChange={(event) => {
            onChange({ failcounter_clear_timeout: event.currentTarget.value });
          }}
          placeholder="0"
          value={form.failcounter_clear_timeout}
        />
        <Checkbox
          checked={form.no_auth_counter}
          id="NoAuthCounter"
          label={t`Do not use an authentication counter per token.`}
          onChange={(event) => {
            onChange({ no_auth_counter: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.PrependPin}
          id="PrependPin"
          label={t`Prepend the PIN in front of the OTP value. Otherwise it will be post pended.`}
          onChange={(event) => {
            onChange({ PrependPin: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.ReturnSamlAttributes}
          id="ReturnSamlAttributes"
          label={t`Include SAML attributes in the authentication response.`}
          onChange={(event) => {
            onChange({ ReturnSamlAttributes: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.ReturnSamlAttributesOnFail}
          disabled={!form.ReturnSamlAttributes}
          id="ReturnSamlAttributesOnFail"
          label={t`Include SAML attributes even if the user failed to authenticate.`}
          onChange={(event) => {
            onChange({ ReturnSamlAttributesOnFail: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.AutoResync}
          id="AutoResync"
          label={t`Automatic resync during authentication`}
          onChange={(event) => {
            onChange({ AutoResync: event.currentTarget.checked });
          }}
        />
        <TextInput
          disabled={!form.AutoResync}
          id="AutoResyncTimeout"
          inputMode="numeric"
          label={t`Auto resync timeout`}
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
