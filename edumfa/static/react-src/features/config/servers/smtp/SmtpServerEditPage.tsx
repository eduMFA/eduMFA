import { Trans, useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { SmtpServerForm } from "./SmtpServerForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { getSmtpServers, serverQueryKeys } from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SystemLayout } from "@/features/config/system/SystemLayout";

/**
 * `/config/smtp/edit` creates a definition, `/config/smtp/edit/:identifier`
 * edits one. Like the legacy controller, the single definition is picked
 * from the list call (there is no `GET /smtpserver/<identifier>`).
 */
export function SmtpServerEditPage() {
  const { t } = useLingui();

  const { identifier } = useParams<{ identifier: string }>();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();

  const serversQuery = useQuery({
    enabled: isAuthenticated && identifier !== undefined,
    queryFn: ({ signal }) => getSmtpServers(apiClient, signal),
    queryKey: serverQueryKeys.smtpServers
  });

  const renderBody = () => {
    if (!isAuthenticated) {
      return <LoginRequiredAlert />;
    }

    if (identifier === undefined) {
      return <SmtpServerForm key="new" />;
    }

    const server = serversQuery.data?.[identifier];

    return (
      <>
        <ErrorAlert error={serversQuery.error} />
        {serversQuery.isLoading ? (
          <LoadingIndicator label={t`Loading SMTP servers`} />
        ) : null}
        {server ? (
          <SmtpServerForm existing={{ identifier, server }} key={identifier} />
        ) : null}
        {serversQuery.isSuccess && !server ? (
          <Alert color="yellow" icon={<IconInfoCircle size={18} />} variant="light">
            <Trans>The SMTP server {identifier} does not exist.</Trans>
          </Alert>
        ) : null}
      </>
    );
  };

  return <SystemLayout activeItem="smtp">{renderBody()}</SystemLayout>;
}
