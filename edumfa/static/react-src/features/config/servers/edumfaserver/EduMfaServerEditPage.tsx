import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { EduMfaServerForm } from "./EduMfaServerForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { getEduMfaServers, serverQueryKeys } from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SystemLayout } from "@/features/config/system/SystemLayout";

/**
 * `/config/edumfaserver/edit` creates a definition,
 * `/config/edumfaserver/edit/:identifier` edits one. Like the legacy
 * controller, the single definition is picked from the list call.
 */
export function EduMfaServerEditPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();

  const serversQuery = useQuery({
    enabled: isAuthenticated && identifier !== undefined,
    queryFn: ({ signal }) => getEduMfaServers(apiClient, signal),
    queryKey: serverQueryKeys.eduMfaServers
  });

  const renderBody = () => {
    if (!isAuthenticated) {
      return <LoginRequiredAlert />;
    }

    if (identifier === undefined) {
      return <EduMfaServerForm key="new" />;
    }

    const server = serversQuery.data?.[identifier];

    return (
      <>
        <ErrorAlert error={serversQuery.error} />
        {serversQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading eduMFA servers</Trans>} />
        ) : null}
        {server ? (
          <EduMfaServerForm existing={{ identifier, server }} key={identifier} />
        ) : null}
        {serversQuery.isSuccess && !server ? (
          <Alert color="yellow" icon={<IconInfoCircle size={18} />} variant="light">
            <Trans>The eduMFA server {identifier} does not exist.</Trans>
          </Alert>
        ) : null}
      </>
    );
  };

  return <SystemLayout activeItem="edumfaserver">{renderBody()}</SystemLayout>;
}
