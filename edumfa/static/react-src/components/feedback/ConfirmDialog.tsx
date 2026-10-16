import { Trans } from "@lingui/react/macro";
import { Button, Group, Modal, Text } from "@mantine/core";
import type { ReactNode } from "react";

export interface ConfirmDialogProps {
  cancelLabel?: ReactNode;
  confirmColor?: string;
  confirmLabel: ReactNode;
  id: string;
  isOpen: boolean;
  isPending?: boolean;
  message: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
}

/**
 * Confirmation modal replacing the legacy jQuery `$('#dialog').modal()` call.
 * Escape and the overlay cancel; focus is trapped inside the dialog.
 */
export function ConfirmDialog({
  cancelLabel = <Trans>No</Trans>,
  confirmColor = "red",
  confirmLabel,
  id,
  isOpen,
  isPending = false,
  message,
  onCancel,
  onConfirm,
  title
}: ConfirmDialogProps) {
  return (
    <Modal centered id={id} onClose={onCancel} opened={isOpen} title={title}>
      <Text size="sm">{message}</Text>
      <Group justify="flex-end" mt="lg">
        <Button data-autofocus onClick={onCancel} variant="default">
          {cancelLabel}
        </Button>
        <Button color={confirmColor} loading={isPending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
