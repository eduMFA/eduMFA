import { Trans } from "@lingui/react/macro";
import { Badge } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";

export interface BooleanPillProps {
  falseLabel?: ReactNode;
  trueLabel?: ReactNode;
  value: boolean | null | undefined;
}

/**
 * Renders a boolean as a status badge with an icon instead of the raw `1`/`0`
 * the API delivers. `null`/`undefined` render nothing.
 */
export function BooleanPill({
  falseLabel = <Trans>no</Trans>,
  trueLabel = <Trans>yes</Trans>,
  value
}: BooleanPillProps) {
  if (value === null || value === undefined) {
    return null;
  }

  return (
    <Badge
      color={value ? "green" : "red"}
      component="span"
      data-value={String(value)}
      leftSection={value ? <IconCheck size={12} /> : <IconX size={12} />}
      // Table cells may shrink below the badge width; keep the label whole.
      miw="max-content"
      style={{ verticalAlign: "middle" }}
      variant="light"
    >
      {value ? trueLabel : falseLabel}
    </Badge>
  );
}
