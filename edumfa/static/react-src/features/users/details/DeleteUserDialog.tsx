import { Trans } from "@lingui/react/macro";

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
  return (
    <ConfirmDialog
      confirmLabel={<Trans>Delete User</Trans>}
      id="dialogUserDelete"
      isOpen={isOpen}
      isPending={isPending}
      message={<Trans>Do you really want to delete the user in the user store?</Trans>}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={<Trans>Delete User</Trans>}
    />
  );
}
