import { Trans } from "@lingui/react/macro";
import { Anchor, NativeSelect, Stack, Textarea, TextInput, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { getSmsGateways, systemQueryKeys } from "@/api/system";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { identifierOptions } from "@/features/config/system/systemConfigForm";
import {
  fixedOptions,
  getText,
  smsProviders
} from "@/features/config/tokens/tokenConfigForm";
import { hashHref } from "@/lib/hashbang";

/** Port of `config.token.sms.html`; the gateways come from `GET /smsgateway/`. */
export function SmsConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const apiClient = useApiClient();
  const { isAuthenticated, rights } = useAuth();
  const gatewaysQuery = useQuery({
    enabled: isAuthenticated && hasRight(rights, "smsgateway_read"),
    queryFn: ({ signal }) => getSmsGateways(apiClient, signal),
    queryKey: systemQueryKeys.smsGateways
  });
  const identifier = getText(form, "sms.identifier");
  const provider = getText(form, "sms.Provider");
  const gatewayNames = (gatewaysQuery.data ?? []).map((gateway) => gateway.name);

  return (
    <>
      <HelpText>
        <Trans>
          The SMS Token is an event based token. After the user has tried to
          authenticate with the OTP PIN, an SMS with an OTP value is sent to the users
          mobile phone. Then user can authenticate with this OTP value in a second step.
        </Trans>
      </HelpText>
      <HelpText>
        <Trans>
          Here you can define how the SMS will be sent - via which kind of gateway.
        </Trans>
      </HelpText>
      <ErrorAlert error={gatewaysQuery.error} />
      <Stack gap="sm">
        <NativeSelect
          data={identifierOptions(gatewayNames, identifier)}
          description={
            <Trans>
              Select a predefined{" "}
              <Anchor href={hashHref("/config/smsgateway/list")} inherit>
                SMS Gateway configuration
              </Anchor>
              .
            </Trans>
          }
          id="smsIdentifier"
          label={<Trans>SMS Gateway configuration</Trans>}
          onChange={(event) => {
            onChange({ "sms.identifier": event.currentTarget.value });
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
          id="smsValidity"
          inputMode="numeric"
          label={<Trans>OTP validity time</Trans>}
          onChange={(event) => {
            onChange({ "sms.providerTimeout": event.currentTarget.value });
          }}
          placeholder="300"
          value={getText(form, "sms.providerTimeout")}
        />
        <Title mt="md" order={4} size="h6">
          <Trans>Obsolete settings</Trans>
        </Title>
        <NativeSelect
          data={fixedOptions(smsProviders, provider)}
          disabled
          id="smsProvider"
          label={<Trans>SMS Provider</Trans>}
          value={provider}
        />
        <Textarea
          disabled
          id="smsConfig"
          label={<Trans>Provider Config</Trans>}
          placeholder={"{'USERNAME': 'Your User',\n 'PASSWORD': 'Your Password'}"}
          rows={6}
          value={getText(form, "sms.providerConfig")}
        />
      </Stack>
    </>
  );
}
