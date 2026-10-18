import { useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";

export interface RealmRowActionsProps {
  canDelete: boolean;
  canWrite: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

/** The edit and delete buttons of a realm row. */
export function RealmRowActions({
  canDelete,
  canWrite,
  isDeleting,
  onDelete,
  onEdit
}: RealmRowActionsProps) {
  const { t } = useLingui();

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      {canWrite ? (
        <Button
          leftSection={<IconPencil size={14} />}
          onClick={onEdit}
          size="xs"
          variant="light"
        >
          {t`Edit`}
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          color="red"
          leftSection={<IconTrash size={14} />}
          loading={isDeleting}
          onClick={onDelete}
          size="xs"
          variant="light"
        >
          {t`Delete`}
        </Button>
      ) : null}
    </Group>
  );
}
