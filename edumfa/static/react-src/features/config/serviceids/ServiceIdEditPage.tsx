import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { ServiceIdForm } from "./ServiceIdForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { getServiceId, serviceIdQueryKeys } from "@/api/serviceIds";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SystemLayout } from "@/features/config/system/SystemLayout";

/**
 * Port of `config.serviceid.edit.html`: creates a service ID under
 * `/config/serviceid/edit` and edits one under `/config/serviceid/edit/:servicename`.
 */
export function ServiceIdEditPage() {
  const { servicename } = useParams();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
  const isEditing = servicename !== undefined;

  const serviceQuery = useQuery({
    enabled: isAuthenticated && isEditing,
    queryFn: ({ signal }) => getServiceId(apiClient, servicename ?? "", signal),
    queryKey: serviceIdQueryKeys.detail(servicename ?? "")
  });
  const service = isEditing ? serviceQuery.data?.[servicename] : undefined;

  return (
    <SystemLayout activeItem="serviceid">
      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={serviceQuery.error} />

      {isEditing && serviceQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading service ID</Trans>} />
      ) : null}

      {isEditing && serviceQuery.isSuccess && !service ? (
        <Alert color="yellow" mb="md" role="alert" variant="light">
          <Trans>The service ID {servicename} does not exist.</Trans>
        </Alert>
      ) : null}

      {isAuthenticated && (!isEditing || service) ? (
        <ServiceIdForm
          existing={isEditing ? { service: service ?? {}, servicename } : null}
          key={servicename ?? ""}
        />
      ) : null}
    </SystemLayout>
  );
}
