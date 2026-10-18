import { useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import { RESOURCE_NAME_PATTERN, type ServiceIdFormValues } from "./serviceIdValues";

export interface ServiceIdFieldsProps {
  /** The identifier of an existing definition cannot be changed. */
  isEditing: boolean;
  nameError: string | undefined;
  register: UseFormRegister<ServiceIdFormValues>;
}

/** The identifier (for a new definition) and the description of a service ID. */
export function ServiceIdFields({
  isEditing,
  nameError,
  register
}: ServiceIdFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      {isEditing ? null : (
        <TextInput
          autoFocus
          description={t`This is the unique identifying name for this service definition.`}
          error={nameError}
          id="identifier"
          label={t`Identifier`}
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
        label={t`Description`}
        placeholder={t`some wise words`}
        {...register("description")}
      />
    </>
  );
}
