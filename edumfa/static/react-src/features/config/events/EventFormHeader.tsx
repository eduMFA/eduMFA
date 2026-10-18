import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import type { EventHandlerDefinition, EventWriteParams } from "@/api/events";
import type { DeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { PageHeader } from "@/components/layout/PageHeader";
import type { DefinitionMutations } from "@/features/config/automation/types";

/** Title of the form and, for a stored handler, its delete button. */
export function EventFormHeader({
  canWrite,
  existing,
  mutations,
  onDeleted,
  requestDelete
}: {
  canWrite: boolean;
  existing: EventHandlerDefinition | undefined;
  mutations: DefinitionMutations<EventWriteParams>;
  onDeleted: () => void;
  requestDelete: DeleteConfirmation["requestDelete"];
}) {
  return (
    <PageHeader
      title={
        existing ? (
          <Trans>Edit Event Handler {existing.id}</Trans>
        ) : (
          <Trans>Create a new Event Handler</Trans>
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
                question: <Trans>Do you really want to delete this event?</Trans>,
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
