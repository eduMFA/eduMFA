import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Button, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  getServiceId,
  saveServiceId,
  serviceIdQueryKeys,
  type ServiceId,
  type ServiceIdWriteRequest
} from "@/api/serviceIds";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemLayout } from "@/features/config/system/SystemLayout";
import { pushFlash } from "@/lib/flash";

/** `resourceNamePatterns.simple` of the legacy app. */
const RESOURCE_NAME_PATTERN = /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/;

interface ServiceIdFormValues {
  description: string;
  servicename: string;
}

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

interface ServiceIdFormProps {
  /** The loaded service ID when editing; `null` creates a new one. */
  existing: { service: ServiceId; servicename: string } | null;
}

function ServiceIdForm({ existing }: ServiceIdFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canSave = hasRight(rights, "serviceid_add");
  const { formState, handleSubmit, register, control } = useForm<ServiceIdFormValues>({
    defaultValues: {
      description: existing?.service.description ?? "",
      servicename: existing?.servicename ?? ""
    },
    mode: "onChange"
  });
  const typedName = useWatch({ control, name: "servicename" });

  const saveMutation = useMutation({
    mutationFn: (values: ServiceIdFormValues) => {
      const request: ServiceIdWriteRequest = {
        description: values.description,
        servicename: values.servicename
      };

      if (existing?.service.id !== undefined) {
        request.id = existing.service.id;
      }

      return saveServiceId(apiClient, request);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceIdQueryKeys.all });
      pushFlash(t`Service ID saved.`, "info");
      void navigate("/config/serviceid/list");
    }
  });

  const submitForm = handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitForm(event);
      }}
    >
      <PageHeader
        title={
          existing ? (
            <Trans>Edit Service ID {existing.servicename}</Trans>
          ) : (
            <Trans>Create a new Service ID {typedName}</Trans>
          )
        }
      />

      <ErrorAlert error={saveMutation.error} />

      <Card
        footer={
          canSave ? (
            <Button
              disabled={!formState.isValid}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saveMutation.isPending}
              type="submit"
            >
              <Trans>Save Service ID</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        {existing ? null : (
          <TextInput
            autoFocus
            description={
              <Trans>
                This is the unique identifying name for this service definition.
              </Trans>
            }
            error={formState.errors.servicename?.message}
            id="identifier"
            label={<Trans>Identifier</Trans>}
            mb="md"
            placeholder="myNewService"
            required
            {...register("servicename", {
              pattern: {
                message: t`The resource name must consist of letters, numbers and '_', '-', '.'`,
                value: RESOURCE_NAME_PATTERN
              },
              required: true
            })}
          />
        )}

        <TextInput
          id="description"
          label={<Trans>Description</Trans>}
          placeholder={t`some wise words`}
          {...register("description")}
        />
      </Card>
    </form>
  );
}
