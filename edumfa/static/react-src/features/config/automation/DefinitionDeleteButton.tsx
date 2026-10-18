import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

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
            kind === "events"
              ? t`Do you really want to delete this event?`
              : t`Do you really want to delete this periodic task?`,
          onConfirm
        });
      }}
    >
      {t`Delete`}
    </Button>
  );
}
