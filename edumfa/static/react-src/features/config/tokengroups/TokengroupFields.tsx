import { Trans, useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import { RESOURCE_NAME_PATTERN, type TokengroupFormValues } from "./tokengroupValues";

export interface TokengroupFieldsProps {
  /** The identifier of an existing group cannot be changed. */
  isEditing: boolean;
  nameError: string | undefined;
  register: UseFormRegister<TokengroupFormValues>;
}

/** The identifier (for a new group) and the description of a token group. */
export function TokengroupFields({
  isEditing,
  nameError,
  register
}: TokengroupFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      {isEditing ? null : (
        <TextInput
          autoFocus
          description={
            <Trans>
              This is the unique identifying name for this group definition.
            </Trans>
          }
          error={nameError}
          id="identifier"
          label={<Trans>Identifier</Trans>}
          mb="md"
          placeholder="myNewGroup"
          required
          {...register("groupname", {
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
    </>
  );
}
