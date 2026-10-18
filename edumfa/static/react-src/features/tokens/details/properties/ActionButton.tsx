import { Button, type ButtonProps } from "@mantine/core";

import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";

export interface ActionButtonProps extends ButtonProps {
  id?: string;
  onClick: () => void;
  /** The right that allows the action. */
  right: string;
}

/**
 * Legacy pattern for action buttons: without the right the button is
 * disabled, and hidden altogether under the `hide_buttons` policy.
 */
export function ActionButton({ right, ...buttonProps }: ActionButtonProps) {
  const { rights, settings } = useAuth();
  const allowed = hasRight(rights, right);

  if (!allowed && settings.hideButtons) {
    return null;
  }

  return <Button disabled={!allowed} size="xs" {...buttonProps} />;
}
