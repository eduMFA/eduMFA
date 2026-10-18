import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm, useWatch } from "react-hook-form";

import type { SaveCaConnectorVariables } from "./caConnectorEditor";
import { RESOURCE_NAME_PATTERN } from "./caConnectorForm";
import { CaConnectorNameField } from "./CaConnectorNameField";
import { MicrosoftCaBaseFields } from "./MicrosoftCaBaseFields";
import {
  toMicrosoftCaFormValues,
  toMicrosoftCaRequest,
  type MicrosoftCaFormValues
} from "./microsoftCaForm";
import { MicrosoftCaOptionsFields } from "./MicrosoftCaOptionsFields";
import { MicrosoftCaSslFields } from "./MicrosoftCaSslFields";
import type { CaConnector } from "@/api/caConnectors";
import { Card } from "@/components/layout/Card";

export interface MicrosoftCaConnectorFormProps {
  canWrite: boolean;
  /** The loaded connector when editing; `null` creates a new one. */
  connector: CaConnector | null;
  isSaving: boolean;
  onSave: (variables: SaveCaConnectorVariables) => void;
}

/** The form of `config.caconnectors.microsoft.html`: base, SSL and CA options. */
export function MicrosoftCaConnectorForm({
  canWrite,
  connector,
  isSaving,
  onSave
}: MicrosoftCaConnectorFormProps) {
  const { t } = useLingui();
  const isEditing = connector !== null;
  const { formState, getValues, handleSubmit, register, control } =
    useForm<MicrosoftCaFormValues>({
      defaultValues: toMicrosoftCaFormValues(connector),
      mode: "onChange"
    });
  const caValue = useWatch({ control, name: "ca" });

  const submitForm = handleSubmit((values) => {
    onSave({
      name: values.connectorname,
      request: toMicrosoftCaRequest(values, isEditing)
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
              disabled={!formState.isValid || caValue === ""}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={isSaving}
              type="submit"
            >
              <Trans>Save CA</Trans>
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
        <MicrosoftCaBaseFields register={register} />
        <MicrosoftCaSslFields control={control} register={register} />
        <MicrosoftCaOptionsFields
          control={control}
          getValues={getValues}
          isEditing={isEditing}
          register={register}
        />
      </Card>
    </form>
  );
}
