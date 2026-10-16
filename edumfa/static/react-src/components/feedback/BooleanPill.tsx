import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";

export interface BooleanPillProps {
  falseLabel?: ReactNode;
  trueLabel?: ReactNode;
  value: boolean | null | undefined;
}

/**
 * Renders a boolean as a status pill with an icon instead of the raw `1`/`0`
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
    <span className={value ? "label label-success" : "label label-danger"}>
      <span
        aria-hidden="true"
        className={value ? "glyphicon glyphicon-ok" : "glyphicon glyphicon-remove"}
      />{" "}
      {value ? trueLabel : falseLabel}
    </span>
  );
}
