import { useLingui } from "@lingui/react/macro";
import { Badge } from "@mantine/core";

import { ActionBadge } from "./ActionBadge";
import type { TokenDetail } from "@/api/tokens";

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
