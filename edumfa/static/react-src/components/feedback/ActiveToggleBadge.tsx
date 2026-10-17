import { Trans } from "@lingui/react/macro";
import { Tooltip, UnstyledButton } from "@mantine/core";

import { BooleanPill } from "./BooleanPill";

export interface ActiveToggleBadgeProps {
  active: boolean;
  /** Tooltip and accessible name while the object is active. */
  disableLabel: string;
  /** Tooltip and accessible name while the object is inactive. */
  enableLabel: string;
  /** Enables or disables the object; leave out when the session lacks the right. */
  onToggle?: (() => void) | undefined;
}

/**
 * Active state of a configuration object (event handler, periodic task).
 * The legacy lists made the glyphicon clickable without any affordance;
 * here the badge becomes a labelled button when an action is available and
 * stays a plain badge otherwise.
 */
export function ActiveToggleBadge({
  active,
  disableLabel,
  enableLabel,
  onToggle
}: ActiveToggleBadgeProps) {
  const pill = (
    <BooleanPill
      falseLabel={<Trans>inactive</Trans>}
      trueLabel={<Trans>active</Trans>}
      value={active}
    />
  );

  if (!onToggle) {
    return pill;
  }

  const label = active ? disableLabel : enableLabel;

  return (
    <Tooltip label={label} withArrow>
      <UnstyledButton
        aria-label={label}
        display="inline-flex"
        lh={1}
        onClick={onToggle}
        style={{ verticalAlign: "middle" }}
        type="button"
      >
        {pill}
      </UnstyledButton>
    </Tooltip>
  );
}
