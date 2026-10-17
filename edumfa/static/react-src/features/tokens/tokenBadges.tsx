import { Trans, useLingui } from "@lingui/react/macro";
import { Badge, Tooltip, UnstyledButton } from "@mantine/core";
import type { ReactNode } from "react";

import type { TokenDetail } from "@/api/tokens";
import { BooleanPill } from "@/components/feedback/BooleanPill";

/** Colours like the legacy `label-success` / `label-warning` / `label-danger` classes. */
export function getFailCounterColor(
  token: Pick<TokenDetail, "failcount" | "maxfail">
): string {
  if (token.failcount >= token.maxfail) {
    return "red";
  }

  if (token.failcount > 0) {
    return "yellow";
  }

  return "green";
}

export interface FailCounterBadgeProps {
  /** Resets the counter; leave out when the session lacks the `reset` right. */
  onReset?: (() => void) | undefined;
  token: Pick<TokenDetail, "failcount" | "maxfail">;
}

export function FailCounterBadge({ onReset, token }: FailCounterBadgeProps) {
  const { t } = useLingui();
  const badge = (
    <Badge
      color={getFailCounterColor(token)}
      component="span"
      style={{ verticalAlign: "middle" }}
      variant="light"
    >
      {token.failcount}
    </Badge>
  );

  return (
    <ActionBadge label={onReset ? t`Reset Failcounter` : null} onClick={onReset}>
      {badge}
    </ActionBadge>
  );
}

export interface TokenActiveBadgeProps {
  active: boolean;
  /** Enables or disables the token; leave out when the session lacks the right. */
  onToggle?: (() => void) | undefined;
}

export function TokenActiveBadge({ active, onToggle }: TokenActiveBadgeProps) {
  const { t } = useLingui();
  const label = active ? t`Disable token` : t`Enable token`;

  return (
    <ActionBadge label={onToggle ? label : null} onClick={onToggle}>
      <BooleanPill
        falseLabel={<Trans>disabled</Trans>}
        trueLabel={<Trans>active</Trans>}
        value={active}
      />
    </ActionBadge>
  );
}

interface ActionBadgeProps {
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
function ActionBadge({ children, label, onClick }: ActionBadgeProps) {
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
