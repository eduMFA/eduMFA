import { Trans, useLingui } from "@lingui/react/macro";

import { ActionBadge } from "./ActionBadge";
import { BooleanPill } from "@/components/feedback/BooleanPill";

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
