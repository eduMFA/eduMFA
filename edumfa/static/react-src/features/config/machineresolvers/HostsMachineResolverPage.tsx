import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Button, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { machineResolverNamePattern, readText } from "./machineResolverFields";
import { MachineResolverSidebar } from "./MachineResolverSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  getMachineResolver,
  machineResolverQueryKeys,
  saveMachineResolver
} from "@/api/machineResolvers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

interface HostsFormValues {
  filename: string;
  resolvername: string;
}

/** The legacy controller preset this file for a new resolver. */
const defaultFilename = "/etc/hosts";

/**
 * Port of `config.mresolvers.hosts.html` and `hostsResolverController`: the
 * editor of a hosts file machine resolver, for a new resolver and for the
 * one named in the route.
 */
export function HostsMachineResolverPage() {
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
            <Trans>Create a new hosts Machine Resolver</Trans>
          )
        }
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={resolverQuery.error} />
          {resolverQuery.isLoading ? (
            <LoadingIndicator label={<Trans>Loading resolver</Trans>} />
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

interface HostsMachineResolverFormProps {
  initialValues: HostsFormValues;
  /** Stored keys of the resolver; sent back unchanged like the legacy `$scope.params`. */
  storedData: Record<string, unknown>;
}

function HostsMachineResolverForm({
  initialValues,
  storedData
}: HostsMachineResolverFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const { formState, handleSubmit, register } = useForm<HostsFormValues>({
    defaultValues: initialValues,
    mode: "onChange"
  });

  const saveMutation = useMutation({
    mutationFn: (values: HostsFormValues) =>
      saveMachineResolver(apiClient, values.resolvername, {
        ...storedData,
        filename: values.filename,
        type: "hosts"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: machineResolverQueryKeys.all });
      void navigate("/config/machineresolvers/list");
    }
  });

  const submitResolver = handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitResolver(event);
      }}
    >
      <ErrorAlert error={saveMutation.error} />
      <Card
        footer={
          hasRight(rights, "mresolverwrite") ? (
            <Button
              disabled={!formState.isValid}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saveMutation.isPending}
              type="submit"
            >
              <Trans>Save resolver</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TextInput
          autoFocus
          error={formState.errors.resolvername?.message}
          id="resolvername"
          label={<Trans>Resolver name</Trans>}
          mb="sm"
          placeholder="MachineResolver1"
          required
          {...register("resolvername", {
            pattern: {
              message: t`The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'test'`,
              value: machineResolverNamePattern
            },
            required: true
          })}
        />
        <TextInput
          error={formState.errors.filename?.message}
          id="resolverfile"
          label={<Trans>File name</Trans>}
          placeholder="/etc/hosts"
          required
          {...register("filename", { required: true })}
        />
      </Card>
    </form>
  );
}
