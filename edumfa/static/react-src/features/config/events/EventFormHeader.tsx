import { Trans, useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <PageHeader
      title={
        existing ? (
          <Trans>Edit Event Handler {existing.id}</Trans>
        ) : (
          t`Create a new Event Handler`
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
                question: t`Do you really want to delete this event?`,
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
