import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { DefinitionKind } from "./DefinitionLayout";
import type { DeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";

/** Delete button of a definition row with the question matching its kind. */
export function DefinitionDeleteButton({
  disabled,
  kind,
  name,
  onConfirm,
  requestDelete
}: {
  disabled: boolean;
  kind: DefinitionKind;
  name: string;
  onConfirm: () => void;
  requestDelete: DeleteConfirmation["requestDelete"];
}) {
  return (
    <Button
      color="red"
      size="xs"
      variant="light"
      leftSection={<IconTrash aria-hidden size={16} />}
      disabled={disabled}
      onClick={() => {
        requestDelete({
          identifier: name,
          question:
            kind === "events" ? (
              <Trans>Do you really want to delete this event?</Trans>
            ) : (
              <Trans>Do you really want to delete this periodic task?</Trans>
            ),
          onConfirm
        });
      }}
    >
      <Trans>Delete</Trans>
    </Button>
  );
}
