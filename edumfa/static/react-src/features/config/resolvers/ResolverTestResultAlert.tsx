import { useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";

import type { ResolverTestOutcome } from "./useResolverEditor";

export interface ResolverTestResultAlertProps {
  onDismiss: () => void;
  outcome: ResolverTestOutcome | null;
}

/**
 * The outcome of the last connection test, the inline counterpart of the
 * `showResult` label the legacy templates reserved for it.
 */
export function ResolverTestResultAlert({
  onDismiss,
  outcome
}: ResolverTestResultAlertProps) {
  const { t } = useLingui();

  if (!outcome) {
    return null;
  }

  return (
    <Alert
      closeButtonLabel={t`Close`}
      color={outcome.success ? "green" : "red"}
      icon={
        outcome.success ? <IconCircleCheck size={18} /> : <IconAlertCircle size={18} />
      }
      mb="md"
      onClose={onDismiss}
      role="status"
      variant="light"
      withCloseButton
    >
      {outcome.description}
    </Alert>
  );
}
