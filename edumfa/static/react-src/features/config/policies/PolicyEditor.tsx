import { Trans } from "@lingui/react/macro";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { Button, Group } from "@mantine/core";

import { PolicyActionsEditor } from "./PolicyActionsEditor";
import { PolicyConditionCard } from "./PolicyConditionCard";
import { PolicyConditionsEditor } from "./PolicyConditionsEditor";
import { PolicyEditorToolbar } from "./PolicyEditorToolbar";
import { PolicyGeneralCard } from "./PolicyGeneralCard";
import { usePolicyEditorForm } from "./usePolicyEditorForm";
import { usePolicyEditorLookups } from "./usePolicyEditorLookups";
import type {
  Policy,
  PolicyConditionDefinitions,
  PolicyDefinitions
} from "@/api/policies";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";

/** Create/edit form of one policy; `key` on the caller remounts it per policy. */
export function PolicyEditor({
  policy,
  definitions,
  conditionDefinitions
}: {
  policy: Policy | undefined;
  definitions: PolicyDefinitions;
  conditionDefinitions: PolicyConditionDefinitions;
}) {
  const editor = usePolicyEditorForm(policy, definitions);
  const { canWrite, form, mutations, update } = editor;
  const { dialog, requestDelete } = useDeleteConfirmation();
  const lookups = usePolicyEditorLookups(form.scope);

  return (
    <>
      {policy ? (
        <PolicyEditorToolbar
          active={form.active}
          canDelete={editor.canDelete}
          canWrite={canWrite}
          mutations={mutations}
          policy={policy}
          requestDelete={requestDelete}
          onActiveChange={(active) => {
            update({ active });
          }}
        />
      ) : null}
      <ErrorAlert
        error={mutations.save.error ?? mutations.toggle.error ?? mutations.remove.error}
      />
      <ErrorAlert error={lookups.error} />
      <form noValidate onSubmit={editor.submit}>
        <fieldset
          disabled={!canWrite || mutations.busy || editor.loadingTemplate}
          style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
        >
          <PolicyGeneralCard
            canWrite={canWrite}
            definitions={definitions}
            form={form}
            policy={policy}
            onChange={update}
            onTemplate={editor.applyTemplate}
            onTemplateBusyChange={editor.setLoadingTemplate}
          />
          <PolicyConditionCard form={form} lookups={lookups} onChange={update} />
          <Card title={<Trans>Additional conditions</Trans>}>
            <PolicyConditionsEditor
              conditions={form.conditions}
              definitions={conditionDefinitions}
              onChange={(conditions) => {
                update({ conditions });
              }}
            />
          </Card>
          {form.scope ? (
            <Card title={<Trans>Action</Trans>}>
              <PolicyActionsEditor
                key={form.scope}
                scope={form.scope}
                definitions={definitions[form.scope] ?? {}}
                actions={form.actions}
                onChange={(actions) => {
                  update({ actions });
                }}
              />
            </Card>
          ) : null}
          {canWrite ? (
            <Group justify="center">
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy aria-hidden size={16} />}
                disabled={!editor.valid || mutations.busy}
                loading={mutations.save.isPending}
              >
                <Trans>Save Policy</Trans>
              </Button>
            </Group>
          ) : null}
        </fieldset>
      </form>
      {dialog}
    </>
  );
}
