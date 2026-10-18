import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Checkbox, NativeSelect, Stack, TextInput } from "@mantine/core";

import { identifierOptions, type SystemConfigCardProps } from "./systemConfigForm";
import { Card } from "@/components/layout/Card";
import { hashHref } from "@/lib/hashbang";

export interface ServerSettingsCardProps extends SystemConfigCardProps {
  /** Identifiers of `GET /smtpserver/` for the password recovery select. */
  smtpIdentifiers: readonly string[];
}

/**
 * The housekeeping entries of `config.system.edit.html`: the challenge
 * janitor, client tracking, the user cache, the clients allowed to override
 * the client address and the SMTP server used for password recovery.
 */
export function ServerSettingsCard({
  form,
  onChange,
  smtpIdentifiers
}: ServerSettingsCardProps) {
  const { t } = useLingui();

  return (
    <Card title={t`Server settings`}>
      <Stack gap="sm">
        <Checkbox
          checked={form.DisableAutoChallengeJanitor}
          id="DisableAutoChallengeJanitor"
          label={t`Disable automatic challenge janitor. You should use the token janitor to clean up old challenges and the JWT blocklist if you disable the automatic challenge janitor.`}
          onChange={(event) => {
            onChange({ DisableAutoChallengeJanitor: event.currentTarget.checked });
          }}
        />
        <Checkbox
          checked={form.DisableClientTracking}
          id="DisableClientTracking"
          label={t`Disable client tracking. This will disable the recording of client IP addresses and user agents in the database. This can be used to reduce database locks and load in environments with many concurrent requests.`}
          onChange={(event) => {
            onChange({ DisableClientTracking: event.currentTarget.checked });
          }}
        />
        <TextInput
          id="UserCacheExpiration"
          inputMode="numeric"
          label={t`User Cache expiration in seconds`}
          onChange={(event) => {
            onChange({ UserCacheExpiration: event.currentTarget.value });
          }}
          placeholder="0"
          value={form.UserCacheExpiration}
        />
        <TextInput
          description={t`These client IP addresses or subnets are allowed to masquerade as another client.`}
          id="OverrideAuthorizationClient"
          label={t`Override Authorization Clients`}
          onChange={(event) => {
            onChange({ OverrideAuthorizationClient: event.currentTarget.value });
          }}
          placeholder="127.0.0.1, 10.0.0.8"
          value={form.OverrideAuthorizationClient}
        />
        <NativeSelect
          data={identifierOptions(smtpIdentifiers, form["recovery.identifier"])}
          description={
            <Trans>
              Select a predefined{" "}
              <Anchor href={hashHref("/config/smtp/list")} inherit>
                SMTP server configuration
              </Anchor>
              .
            </Trans>
          }
          id="recovery.identifier"
          label={t`SMTP server for password recovery`}
          onChange={(event) => {
            onChange({ "recovery.identifier": event.currentTarget.value });
          }}
          value={form["recovery.identifier"]}
        />
      </Stack>
    </Card>
  );
}
