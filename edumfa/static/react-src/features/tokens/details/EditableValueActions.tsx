import { useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import type { ReactNode } from "react";

export interface EditableValueActionsProps {
  buttonLabel: ReactNode;
  canEdit: boolean;
  hideButtons: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isValid: boolean;
  locked: boolean;
  onCancel: () => void;
  onEdit: () => void;
  onSave: () => void;
}

/** Right-hand cell of an editable row: nothing, save and cancel, or the edit button. */
export function EditableValueActions({
  buttonLabel,
  canEdit,
  hideButtons,
  isEditing,
  isSaving,
  isValid,
  locked,
  onCancel,
  onEdit,
  onSave
}: EditableValueActionsProps) {
  const { t } = useLingui();

  if (locked) {
    return null;
  }

  if (isEditing) {
    return (
      <Group gap="xs" justify="flex-end">
        <Button disabled={!isValid} loading={isSaving} onClick={onSave} size="xs">
          {buttonLabel}
        </Button>
        <Button onClick={onCancel} size="xs" variant="default">
          {t`Cancel`}
        </Button>
      </Group>
    );
  }

  if (!canEdit && hideButtons) {
    return null;
  }

  return (
    <Button disabled={!canEdit} onClick={onEdit} size="xs" variant="default">
      {t`Edit`}
    </Button>
  );
}
