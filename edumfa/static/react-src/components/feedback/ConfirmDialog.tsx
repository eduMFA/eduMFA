import { Trans } from "@lingui/react/macro";
import { useEffect, useRef, type ReactNode } from "react";

export interface ConfirmDialogProps {
  cancelLabel?: ReactNode;
  confirmClassName?: string;
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
 * Bootstrap 3 confirmation modal driven by React state instead of the legacy
 * jQuery `$('#dialog').modal()` call. Escape closes it and focus lands on the
 * cancel button so a stray Enter key never confirms a destructive action.
 */
export function ConfirmDialog({
  cancelLabel = <Trans>No</Trans>,
  confirmClassName = "btn btn-danger",
  confirmLabel,
  id,
  isOpen,
  isPending = false,
  message,
  onCancel,
  onConfirm,
  title
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const titleId = `${id}-title`;

  return (
    <>
      <div className="modal-backdrop fade in" />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal fade in"
        id={id}
        role="dialog"
        style={{ display: "block" }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button
                aria-label="Close"
                className="close"
                onClick={onCancel}
                type="button"
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title" id={titleId}>
                {title}
              </h4>
            </div>
            <div className="modal-body">{message}</div>
            <div className="modal-footer">
              <button
                className="btn btn-default"
                onClick={onCancel}
                ref={cancelButtonRef}
                type="button"
              >
                {cancelLabel}
              </button>
              <button
                className={confirmClassName}
                disabled={isPending}
                onClick={onConfirm}
                type="button"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
