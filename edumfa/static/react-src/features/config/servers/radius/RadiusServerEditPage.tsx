import { Trans, useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { RadiusServerForm } from "./RadiusServerForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { getRadiusServers, serverQueryKeys } from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SystemLayout } from "@/features/config/system/SystemLayout";

/**
 * `/config/radius/edit` creates a definition, `/config/radius/edit/:identifier`
 * edits one. Like the legacy controller, the single definition is picked
 * from the list call.
 */
export function RadiusServerEditPage() {
  const { t } = useLingui();

  const { identifier } = useParams<{ identifier: string }>();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();

  const serversQuery = useQuery({
    enabled: isAuthenticated && identifier !== undefined,
    queryFn: ({ signal }) => getRadiusServers(apiClient, signal),
    queryKey: serverQueryKeys.radiusServers
  });

  const renderBody = () => {
    if (!isAuthenticated) {
      return <LoginRequiredAlert />;
    }

    if (identifier === undefined) {
      return <RadiusServerForm key="new" />;
    }

    const server = serversQuery.data?.[identifier];

    return (
      <>
        <ErrorAlert error={serversQuery.error} />
        {serversQuery.isLoading ? (
          <LoadingIndicator label={t`Loading RADIUS servers`} />
        ) : null}
        {server ? (
          <RadiusServerForm existing={{ identifier, server }} key={identifier} />
        ) : null}
        {serversQuery.isSuccess && !server ? (
          <Alert color="yellow" icon={<IconInfoCircle size={18} />} variant="light">
            <Trans>The RADIUS server {identifier} does not exist.</Trans>
          </Alert>
        ) : null}
      </>
    );
  };

  return <SystemLayout activeItem="radius">{renderBody()}</SystemLayout>;
}
