import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";

import type { TokenConfigTypeKey } from "./tokenConfigForm";
import { tokenTypes } from "./tokenTypes";
import { useTokenConfigForm } from "./useTokenConfigForm";
import type { SystemConfig } from "@/api/config";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";

/** The settings form of one token type; the fields come from the type's component. */
export function TokenSettingsForm({
  config,
  tokenType
}: {
  config: SystemConfig;
  tokenType: TokenConfigTypeKey;
}) {
  const { t } = useLingui();

  const { dialog, requestDelete } = useDeleteConfirmation();
  const {
    busy,
    canDelete,
    canWrite,
    deleteMutation,
    form,
    request,
    revision,
    save,
    saveMutation,
    update,
    valid
  } = useTokenConfigForm(config, tokenType);
  const { Fields } = tokenTypes[tokenType];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <ErrorAlert error={saveMutation.error} />
      <ErrorAlert error={deleteMutation.error} />
      <Card
        footer={
          canWrite ? (
            <Button
              disabled={!valid || busy || !Object.keys(request).length}
              loading={saveMutation.isPending}
              type="submit"
            >
              {t`Save`}
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <fieldset
          disabled={busy}
          style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
        >
          <Fields
            canDelete={canDelete}
            canWrite={canWrite}
            form={form}
            isSaving={busy}
            key={revision}
            onChange={update}
            onSave={save}
            savedConfig={config}
            onDeleteEntry={(key) => {
              if (canDelete && !busy)
                requestDelete({
                  identifier: key,
                  question: t`Do you really want to delete this configuration entry?`,
                  onConfirm: () => {
                    deleteMutation.mutate(key);
                  }
                });
            }}
          />
        </fieldset>
      </Card>
      {dialog}
    </form>
  );
}
