import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";

import { ApiError } from "../../api/envelope";

export interface ErrorAlertProps {
  error: unknown;
  title?: ReactNode;
}

export function ErrorAlert({
  error,
  title = <Trans>Request failed</Trans>
}: ErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="alert alert-danger" role="alert">
      <strong>{title}</strong>
      <br />
      {getErrorMessage(error) ?? <Trans>An unknown error occurred.</Trans>}
    </div>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return null;
}
