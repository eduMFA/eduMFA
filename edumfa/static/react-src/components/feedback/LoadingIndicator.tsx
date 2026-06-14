import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";

export interface LoadingIndicatorProps {
  label?: ReactNode;
}

export function LoadingIndicator({
  label = <Trans>Loading</Trans>
}: LoadingIndicatorProps) {
  return (
    <div className="react-loading-indicator" role="status">
      <span className="glyphicon glyphicon-refresh glyphicon-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
