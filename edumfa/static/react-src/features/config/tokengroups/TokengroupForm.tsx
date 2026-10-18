import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm, useWatch } from "react-hook-form";

import { TokengroupFields } from "./TokengroupFields";
import type { ExistingTokengroup, TokengroupFormValues } from "./tokengroupValues";
import { useSaveTokengroup } from "./useSaveTokengroup";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";

export interface TokengroupFormProps {
  /** The loaded group when editing; `null` creates a new one. */
  existing: ExistingTokengroup | null;
}

/** The form of `config.tokengroup.edit.html`; the title follows the typed identifier. */
export function TokengroupForm({ existing }: TokengroupFormProps) {
  const { t } = useLingui();

  const { rights } = useAuth();
  const canSave = hasRight(rights, "tokengroup_add");
  const { formState, handleSubmit, register, control } = useForm<TokengroupFormValues>({
    defaultValues: {
      description: existing?.group.description ?? "",
      groupname: existing?.groupname ?? ""
    },
    mode: "onChange"
  });
  const typedName = useWatch({ control, name: "groupname" });
  const saveMutation = useSaveTokengroup(existing);

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
            <Trans>Edit Tokengroup {existing.groupname}</Trans>
          ) : (
            <Trans>Create a new Tokengroup {typedName}</Trans>
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
              {t`Save Tokengroup`}
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TokengroupFields
          isEditing={existing !== null}
          nameError={formState.errors.groupname?.message}
          register={register}
        />
      </Card>
    </form>
  );
}
