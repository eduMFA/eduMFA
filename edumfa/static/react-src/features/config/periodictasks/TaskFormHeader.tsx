import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import type { PeriodicTask, PeriodicTaskWriteParams } from "@/api/periodicTasks";
import type { DeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { PageHeader } from "@/components/layout/PageHeader";
import type { DefinitionMutations } from "@/features/config/automation/types";

/** Title of the form and, for a stored task, its delete button. */
export function TaskFormHeader({
  canWrite,
  existing,
  mutations,
  onDeleted,
  requestDelete
}: {
  canWrite: boolean;
  existing: PeriodicTask | undefined;
  mutations: DefinitionMutations<PeriodicTaskWriteParams>;
  onDeleted: () => void;
  requestDelete: DeleteConfirmation["requestDelete"];
}) {
  const { t } = useLingui();

  return (
    <PageHeader
      title={
        existing ? (
          <Trans>Edit Periodic Task {existing.id}</Trans>
        ) : (
          t`Create a new Periodic Task`
        )
      }
      actions={
        existing && canWrite ? (
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash aria-hidden size={16} />}
            disabled={mutations.busy}
            onClick={() => {
              requestDelete({
                identifier: existing.name,
                question: t`Do you really want to delete this periodic task?`,
                onConfirm: () => {
                  mutations.remove.mutate(existing.id, { onSuccess: onDeleted });
                }
              });
            }}
          >
            {t`Delete`}
          </Button>
        ) : null
      }
    />
  );
}
