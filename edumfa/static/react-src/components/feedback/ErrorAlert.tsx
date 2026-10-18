import { useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { ApiError } from "@/api/envelope";

export interface ErrorAlertProps {
  error: unknown;
  title?: ReactNode;
}

export function ErrorAlert({ error, title }: ErrorAlertProps) {
  const { t } = useLingui();

  if (!error) {
    return null;
  }

  return (
    <Alert
      color="red"
      icon={<IconAlertCircle size={18} />}
      mb="md"
      role="alert"
      title={title ?? t`Request failed`}
      variant="light"
    >
      {getErrorMessage(error) ?? t`An unknown error occurred.`}
    </Alert>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return null;
}
