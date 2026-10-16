import type { ReactNode } from "react";

export interface InfoAlertProps {
  message: ReactNode | null;
  onDismiss?: () => void;
  type?: "danger" | "info" | "success" | "warning" | undefined;
}

/**
 * Inline replacement for the legacy `inform` growl notifications. Migrated
 * routes keep feedback on the page so it survives React re-renders and does
 * not depend on the Angular notification stack.
 */
export function InfoAlert({ message, onDismiss, type = "info" }: InfoAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={`alert alert-${type} alert-dismissible`} role="status">
      {onDismiss ? (
        <button aria-label="Close" className="close" onClick={onDismiss} type="button">
          <span aria-hidden="true">&times;</span>
        </button>
      ) : null}
      {message}
    </div>
  );
}
