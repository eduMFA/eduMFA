import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm, useWatch } from "react-hook-form";

import { ServiceIdFields } from "./ServiceIdFields";
import type { ExistingServiceId, ServiceIdFormValues } from "./serviceIdValues";
import { useSaveServiceId } from "./useSaveServiceId";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";

export interface ServiceIdFormProps {
  /** The loaded service ID when editing; `null` creates a new one. */
  existing: ExistingServiceId | null;
}

/** The form of `config.serviceid.edit.html`; the title follows the typed identifier. */
export function ServiceIdForm({ existing }: ServiceIdFormProps) {
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
  const saveMutation = useSaveServiceId(existing);

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
              {t`Save Service ID`}
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <ServiceIdFields
          isEditing={existing !== null}
          nameError={formState.errors.servicename?.message}
          register={register}
        />
      </Card>
    </form>
  );
}
