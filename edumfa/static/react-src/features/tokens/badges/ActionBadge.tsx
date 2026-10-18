import { Tooltip, UnstyledButton } from "@mantine/core";
import type { ReactNode } from "react";

export interface ActionBadgeProps {
  children: ReactNode;
  label: string | null;
  onClick: (() => void) | undefined;
}

/**
 * The legacy list made the status labels clickable without any affordance.
 * Here the badge becomes a labelled button with a tooltip when an action is
 * available, and stays a plain badge otherwise. The button box is exactly
 * the badge and is centred on the row text, like a bare badge.
 */
export function ActionBadge({ children, label, onClick }: ActionBadgeProps) {
  if (!onClick || label === null) {
    return children;
  }

  return (
    <Tooltip label={label} withArrow>
      <UnstyledButton
        aria-label={label}
        display="inline-flex"
        lh={1}
        onClick={onClick}
        style={{ verticalAlign: "middle" }}
        type="button"
      >
        {children}
      </UnstyledButton>
    </Tooltip>
  );
}
