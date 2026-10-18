import { useLingui } from "@lingui/react/macro";

import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";

export interface DeleteUserDialogProps {
  isOpen: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation before the user is removed from its user store. */
export function DeleteUserDialog({
  isOpen,
  isPending,
  onCancel,
  onConfirm
}: DeleteUserDialogProps) {
  const { t } = useLingui();

  return (
    <ConfirmDialog
      confirmLabel={t`Delete User`}
      id="dialogUserDelete"
      isOpen={isOpen}
      isPending={isPending}
      message={t`Do you really want to delete the user in the user store?`}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={t`Delete User`}
    />
  );
}
