import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { SmsGatewayBaseCard } from "./SmsGatewayBaseCard";
import { buildSmsGatewayRequest, isSmsGatewayValid } from "./smsGatewayValues";
import { SmsProviderCards } from "./SmsProviderCards";
import { useSaveSmsGateway } from "./useSaveSmsGateway";
import { useSmsGatewayValues } from "./useSmsGatewayValues";
import type { SmsGateway, SmsProviders } from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { PageHeader } from "@/components/layout/PageHeader";

export interface SmsGatewayFormProps {
  /** The definition being edited; absent for a new gateway. */
  existing?: SmsGateway;
  providers: SmsProviders;
}

/**
 * Port of `config.smsgateway.edit.html`: name, provider module and
 * description, the module's parameters, and the options and headers
 * tables the module allows. Saving navigates back to the list.
 */
export function SmsGatewayForm({ existing, providers }: SmsGatewayFormProps) {
  const { t } = useLingui();

  const { rights } = useAuth();
  const canWrite = hasRight(rights, "smsgateway_write");
  const { deleteEntry, setEntry, setValue, values } = useSmsGatewayValues(
    existing,
    providers
  );
  const provider = providers[values.module];
  const isValid = isSmsGatewayValid(values, provider);
  const saveMutation = useSaveSmsGateway();

  const saveButton = canWrite ? (
    <Button
      disabled={!isValid}
      leftSection={<IconDeviceFloppy size={16} />}
      loading={saveMutation.isPending}
      type="submit"
    >
      {t`Save SMS gateway`}
    </Button>
  ) : null;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValid) {
          saveMutation.mutate(buildSmsGatewayRequest(values, provider, existing?.id));
        }
      }}
    >
      <PageHeader
        actions={saveButton}
        title={
          existing ? (
            <Trans>Edit SMS gateway {values.name}</Trans>
          ) : (
            t`Create a new SMS gateway`
          )
        }
      />

      <ErrorAlert error={saveMutation.error} />

      <SmsGatewayBaseCard
        moduleNames={Object.keys(providers)}
        setValue={setValue}
        values={values}
      />

      <SmsProviderCards
        onDeleteEntry={deleteEntry}
        onSetEntry={setEntry}
        provider={provider}
        values={values}
      />

      {provider && saveButton ? (
        // The legacy form repeated the button below the parameter tables.
        <Group justify="center" mb="lg">
          {saveButton}
        </Group>
      ) : null}
    </form>
  );
}
