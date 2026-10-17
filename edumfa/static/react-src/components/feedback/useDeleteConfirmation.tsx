import { Trans } from "@lingui/react/macro";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "./ConfirmDialog";
import { useAuth } from "@/auth/AuthProvider";

export interface DeleteRequest {
  /** Shown in brackets after the question, like the legacy dialog. */
  identifier: string;
  onConfirm: () => void;
  /** Defaults to "Do you really want to delete this object?". */
  question?: ReactNode;
}

export interface DeleteConfirmation {
  /** Render once in the page; empty while nothing is pending. */
  dialog: ReactNode;
  /**
   * Port of the legacy `confirmDelete`: asks first when the
   * `deletion_confirmation` policy is set, otherwise deletes right away.
   */
  requestDelete: (request: DeleteRequest) => void;
}

export function useDeleteConfirmation(): DeleteConfirmation {
  const { settings } = useAuth();
  const [pending, setPending] = useState<DeleteRequest | null>(null);

  const requestDelete = (request: DeleteRequest) => {
    if (settings.deletionConfirmation) {
      setPending(request);
    } else {
      request.onConfirm();
    }
  };

  const dialog = pending ? (
    <ConfirmDialog
      confirmLabel={<Trans>Delete</Trans>}
      id="dialogConfirmDelete"
      isOpen
      message={
        <>
          {pending.question ?? <Trans>Do you really want to delete this object?</Trans>}{" "}
          ({pending.identifier})
        </>
      }
      onCancel={() => {
        setPending(null);
      }}
      onConfirm={() => {
        setPending(null);
        pending.onConfirm();
      }}
      title={<Trans>Delete Configuration</Trans>}
    />
  ) : null;

  return { dialog, requestDelete };
}
