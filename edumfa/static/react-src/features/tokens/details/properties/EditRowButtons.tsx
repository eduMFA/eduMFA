import { useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import type { ReactNode } from "react";

import { ActionButton } from "./ActionButton";
import { useAuth } from "@/auth/AuthProvider";

export interface EditRowButtonsProps {
  isEditing: boolean;
  isSaving: boolean;
  /** Locked tokens cannot be changed at all; no buttons are shown. */
  locked: boolean;
  onCancel: () => void;
  onEdit: () => void;
  onSave: () => void;
  /** The right that allows editing the row. */
  right: string;
  saveLabel: ReactNode;
}

/**
 * Edit, save and cancel buttons of a properties row. Only admins edit these
 * rows; without the right the edit button follows the `ActionButton` rules.
 */
export function EditRowButtons({
  isEditing,
  isSaving,
  locked,
  onCancel,
  onEdit,
  onSave,
  right,
  saveLabel
}: EditRowButtonsProps) {
  const { t } = useLingui();

  const { user } = useAuth();
  const canEditRows = user?.role === "admin" && !locked;

  if (!canEditRows) {
    return null;
  }

  if (isEditing) {
    return (
      <Group gap="xs" justify="flex-end">
        <Button loading={isSaving} onClick={onSave} size="xs">
          {saveLabel}
        </Button>
        <Button onClick={onCancel} size="xs" variant="default">
          {t`Cancel`}
        </Button>
      </Group>
    );
  }

  return (
    <ActionButton onClick={onEdit} right={right} variant="default">
      {t`Edit`}
    </ActionButton>
  );
}
