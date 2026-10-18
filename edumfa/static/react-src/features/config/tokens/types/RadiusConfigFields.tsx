import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, NativeSelect } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { getRadiusServers, systemQueryKeys } from "@/api/system";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { identifierOptions } from "@/features/config/system/systemConfigForm";
import { getText } from "@/features/config/tokens/tokenConfigForm";
import { hashHref } from "@/lib/hashbang";

/** Port of `config.token.radius.html`; the servers come from `GET /radiusserver/`. */
export function RadiusConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const { t } = useLingui();

  const apiClient = useApiClient();
  const { isAuthenticated, rights } = useAuth();
  const radiusServersQuery = useQuery({
    enabled: isAuthenticated && hasRight(rights, "radiusserver_read"),
    queryFn: ({ signal }) => getRadiusServers(apiClient, signal),
    queryKey: systemQueryKeys.radiusServers
  });
  const identifier = getText(form, "radius.identifier");

  return (
    <>
      <HelpText>
        {t`The RADIUS token forwards the authentication request to another RADIUS server.`}
      </HelpText>
      <ErrorAlert error={radiusServersQuery.error} />
      <NativeSelect
        data={identifierOptions(Object.keys(radiusServersQuery.data ?? {}), identifier)}
        description={
          <Trans>
            Select a predefined{" "}
            <Anchor href={hashHref("/config/radius/list")} inherit>
              RADIUS server configuration
            </Anchor>
            .
          </Trans>
        }
        id="radiusIdentifier"
        label={t`RADIUS server configuration`}
        onChange={(event) => {
          onChange({ "radius.identifier": event.currentTarget.value });
        }}
        value={identifier}
      />
    </>
  );
}
