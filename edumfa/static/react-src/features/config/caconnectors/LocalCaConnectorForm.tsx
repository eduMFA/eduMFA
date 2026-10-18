import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm } from "react-hook-form";

import type { SaveCaConnectorVariables } from "./caConnectorEditor";
import { buildCaConnectorRequest, RESOURCE_NAME_PATTERN } from "./caConnectorForm";
import { CaConnectorNameField } from "./CaConnectorNameField";
import { LocalCaBaseFields } from "./LocalCaBaseFields";
import { LocalCaCrlFields } from "./LocalCaCrlFields";
import { toLocalCaFormValues, type LocalCaFormValues } from "./localCaForm";
import type { CaConnector } from "@/api/caConnectors";
import { Card } from "@/components/layout/Card";

export interface LocalCaConnectorFormProps {
  canWrite: boolean;
  /** The loaded connector when editing; `null` creates a new one. */
  connector: CaConnector | null;
  isSaving: boolean;
  onSave: (variables: SaveCaConnectorVariables) => void;
}

/** The form of `config.caconnectors.local.html`: the base and CRL configuration. */
export function LocalCaConnectorForm({
  canWrite,
  connector,
  isSaving,
  onSave
}: LocalCaConnectorFormProps) {
  const { t } = useLingui();
  const { formState, handleSubmit, register } = useForm<LocalCaFormValues>({
    defaultValues: toLocalCaFormValues(connector),
    mode: "onChange"
  });

  const submitForm = handleSubmit(({ connectorname, opensslCnf, ...values }) => {
    onSave({
      name: connectorname,
      request: buildCaConnectorRequest("local", {
        ...values,
        "openssl.cnf": opensslCnf
      })
    });
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitForm(event);
      }}
    >
      <Card
        footer={
          canWrite ? (
            <Button
              disabled={!formState.isValid}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={isSaving}
              type="submit"
            >
              {t`Save CA`}
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <CaConnectorNameField
          error={formState.errors.connectorname?.message}
          registration={register("connectorname", {
            pattern: {
              message: t`The resource name must consist of letters, numbers and '_', '-', '.'`,
              value: RESOURCE_NAME_PATTERN
            },
            required: true
          })}
        />
        <LocalCaBaseFields register={register} />
        <LocalCaCrlFields register={register} />
      </Card>
    </form>
  );
}
