import { Trans, useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { HostsMachineResolverForm } from "./HostsMachineResolverForm";
import { defaultFilename } from "./hostsMachineResolverValues";
import { readText } from "./machineResolverFields";
import { MachineResolverSidebar } from "./MachineResolverSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import { getMachineResolver, machineResolverQueryKeys } from "@/api/machineResolvers";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

/**
 * Port of `config.mresolvers.hosts.html` and `hostsResolverController`: the
 * editor of a hosts file machine resolver, for a new resolver and for the
 * one named in the route.
 */
export function HostsMachineResolverPage() {
  const { t } = useLingui();

  const { resolvername } = useParams<{ resolvername: string }>();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
  const isEditing = resolvername !== undefined;

  const resolverQuery = useQuery({
    enabled: isAuthenticated && isEditing,
    queryFn: ({ signal }) => getMachineResolver(apiClient, resolvername ?? "", signal),
    queryKey: machineResolverQueryKeys.detail(resolvername ?? "")
  });
  const storedResolver =
    resolvername === undefined ? undefined : resolverQuery.data?.[resolvername];
  const storedData = storedResolver?.data ?? {};

  return (
    <SidebarLayout
      sidebar={
        <MachineResolverSidebar activeItem="hosts" resolverName={resolvername} />
      }
    >
      <PageHeader
        title={
          isEditing ? (
            <Trans>Edit hosts Machine Resolver {resolvername}</Trans>
          ) : (
            t`Create a new hosts Machine Resolver`
          )
        }
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={resolverQuery.error} />
          {resolverQuery.isLoading ? (
            <LoadingIndicator label={t`Loading resolver`} />
          ) : null}
          {resolverQuery.isSuccess && storedResolver === undefined ? (
            <Alert color="yellow" mb="md" role="alert" variant="light">
              <Trans>The machine resolver {resolvername} does not exist.</Trans>
            </Alert>
          ) : null}
          {!isEditing || storedResolver ? (
            <HostsMachineResolverForm
              initialValues={{
                filename: isEditing ? readText(storedData.filename) : defaultFilename,
                resolvername: resolvername ?? ""
              }}
              key={resolvername ?? ""}
              storedData={storedData}
            />
          ) : null}
        </>
      )}
    </SidebarLayout>
  );
}
