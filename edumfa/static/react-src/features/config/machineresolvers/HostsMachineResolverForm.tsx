import { useLingui } from "@lingui/react/macro";
import { Button, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm } from "react-hook-form";

import type { HostsFormValues } from "./hostsMachineResolverValues";
import { machineResolverNamePattern } from "./machineResolverFields";
import { useSaveHostsMachineResolver } from "./useSaveHostsMachineResolver";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

export interface HostsMachineResolverFormProps {
  initialValues: HostsFormValues;
  /** Stored keys of the resolver; sent back unchanged like the legacy `$scope.params`. */
  storedData: Record<string, unknown>;
}

/** The form of `config.mresolvers.hosts.html`: the resolver name and the hosts file. */
export function HostsMachineResolverForm({
  initialValues,
  storedData
}: HostsMachineResolverFormProps) {
  const { t } = useLingui();
  const { rights } = useAuth();
  const { formState, handleSubmit, register } = useForm<HostsFormValues>({
    defaultValues: initialValues,
    mode: "onChange"
  });
  const saveMutation = useSaveHostsMachineResolver(storedData);

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
              {t`Save resolver`}
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TextInput
          autoFocus
          error={formState.errors.resolvername?.message}
          id="resolvername"
          label={t`Resolver name`}
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
          label={t`File name`}
          placeholder="/etc/hosts"
          required
          {...register("filename", { required: true })}
        />
      </Card>
    </form>
  );
}
