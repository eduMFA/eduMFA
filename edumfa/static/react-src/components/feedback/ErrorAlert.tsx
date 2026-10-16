import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
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
    <Alert
      color="red"
      icon={<IconAlertCircle size={18} />}
      mb="md"
      role="alert"
      title={title}
      variant="light"
    >
      {getErrorMessage(error) ?? <Trans>An unknown error occurred.</Trans>}
    </Alert>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return null;
}
