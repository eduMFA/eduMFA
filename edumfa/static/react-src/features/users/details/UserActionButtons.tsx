import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

export interface UserActionButtonsProps {
  canDelete: boolean;
  canUpdate: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

/** "Edit user" / "Delete user" in the header of the attributes card. */
export function UserActionButtons({
  canDelete,
  canUpdate,
  onDelete,
  onEdit
}: UserActionButtonsProps) {
  const { t } = useLingui();

  return (
    <>
      {canUpdate ? (
        <Button leftSection={<IconEdit size={16} />} onClick={onEdit} size="sm">
          {t`Edit user`}
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          color="red"
          leftSection={<IconTrash size={16} />}
          onClick={onDelete}
          size="sm"
          variant="light"
        >
          {t`Delete user`}
        </Button>
      ) : null}
    </>
  );
}
