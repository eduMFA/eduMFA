import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { SmsGatewayForm } from "./SmsGatewayForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { getSmsGateway, getSmsProviders, serverQueryKeys } from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SystemLayout } from "@/features/config/system/SystemLayout";

/**
 * `/config/smsgateway/edit` creates a definition,
 * `/config/smsgateway/edit/:gateway_id` edits one. The provider modules
 * are loaded first because the form splits the stored options by the
 * module's declared parameters.
 */
export function SmsGatewayEditPage() {
  const { gateway_id: gatewayId } = useParams<{ gateway_id: string }>();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();

  const providersQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSmsProviders(apiClient, signal),
    queryKey: serverQueryKeys.smsProviders
  });

  const gatewayQuery = useQuery({
    enabled: isAuthenticated && gatewayId !== undefined,
    queryFn: ({ signal }) => getSmsGateway(apiClient, gatewayId ?? "", signal),
    queryKey: serverQueryKeys.smsGateway(gatewayId ?? "")
  });

  const renderBody = () => {
    if (!isAuthenticated) {
      return <LoginRequiredAlert />;
    }

    const providers = providersQuery.data;
    const isLoading =
      providersQuery.isLoading || (gatewayId !== undefined && gatewayQuery.isLoading);

    return (
      <>
        <ErrorAlert error={providersQuery.error} />
        <ErrorAlert error={gatewayQuery.error} />
        {isLoading ? (
          <LoadingIndicator label={<Trans>Loading SMS gateway</Trans>} />
        ) : null}
        {providers ? renderForm(providers) : null}
      </>
    );
  };

  const renderForm = (providers: NonNullable<typeof providersQuery.data>) => {
    if (gatewayId === undefined) {
      return <SmsGatewayForm key="new" providers={providers} />;
    }

    const gateway = gatewayQuery.data?.[0];

    if (gateway) {
      return (
        <SmsGatewayForm existing={gateway} key={gatewayId} providers={providers} />
      );
    }

    if (gatewayQuery.isSuccess) {
      return (
        <Alert color="yellow" icon={<IconInfoCircle size={18} />} variant="light">
          <Trans>The SMS gateway {gatewayId} does not exist.</Trans>
        </Alert>
      );
    }

    return null;
  };

  return <SystemLayout activeItem="smsgateway">{renderBody()}</SystemLayout>;
}
