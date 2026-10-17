import { Trans } from "@lingui/react/macro";
import { Anchor, NativeSelect, Stack, TextInput } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { getSmtpServers, systemQueryKeys } from "@/api/system";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { identifierOptions } from "@/features/config/system/systemConfigForm";
import { getText } from "@/features/config/tokens/tokenConfigForm";
import { hashHref } from "@/lib/hashbang";

/** Port of `config.token.email.html`; the servers come from `GET /smtpserver/`. */
export function EmailConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const apiClient = useApiClient();
  const { isAuthenticated, rights } = useAuth();
  const smtpServersQuery = useQuery({
    enabled: isAuthenticated && hasRight(rights, "smtpserver_read"),
    queryFn: ({ signal }) => getSmtpServers(apiClient, signal),
    queryKey: systemQueryKeys.smtpServers
  });
  const identifier = getText(form, "email.identifier");

  return (
    <>
      <HelpText>
        <Trans>
          The EMail token is a challenge response token that sends the OTP value to the
          given email address, when the correct OTP PIN was presented by the user.
        </Trans>
      </HelpText>
      <ErrorAlert error={smtpServersQuery.error} />
      <Stack gap="sm">
        <NativeSelect
          data={identifierOptions(Object.keys(smtpServersQuery.data ?? {}), identifier)}
          description={
            <Trans>
              Select a predefined{" "}
              <Anchor href={hashHref("/config/smtp/list")} inherit>
                SMTP server configuration
              </Anchor>
              .
            </Trans>
          }
          id="emailIdentifier"
          label={<Trans>SMTP server configuration</Trans>}
          onChange={(event) => {
            onChange({ "email.identifier": event.currentTarget.value });
          }}
          value={identifier}
        />
        <TextInput
          description={
            <Trans>
              The time in seconds for which the sent OTP value is valid for
              authentication.
            </Trans>
          }
          id="mailvalid"
          inputMode="numeric"
          label={<Trans>OTP validity time</Trans>}
          onChange={(event) => {
            onChange({ "email.validtime": event.currentTarget.value });
          }}
          value={getText(form, "email.validtime")}
        />
      </Stack>
    </>
  );
}
