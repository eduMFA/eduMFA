import { Trans } from "@lingui/react/macro";
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
  return (
    <PageHeader
      title={
        existing ? (
          <Trans>Edit Periodic Task {existing.id}</Trans>
        ) : (
          <Trans>Create a new Periodic Task</Trans>
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
                question: (
                  <Trans>Do you really want to delete this periodic task?</Trans>
                ),
                onConfirm: () => {
                  mutations.remove.mutate(existing.id, { onSuccess: onDeleted });
                }
              });
            }}
          >
            <Trans>Delete</Trans>
          </Button>
        ) : null
      }
    />
  );
}
