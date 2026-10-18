import { Trans, useLingui } from "@lingui/react/macro";

import type { EnrollMode } from "./enrollForm";

export interface EnrollPageTitleProps {
  mode: EnrollMode;
  rolloverSerial: string;
}

/** Heading of the enroll form in its plain, wizard and rollover variants. */
export function EnrollPageTitle({ mode, rolloverSerial }: EnrollPageTitleProps) {
  const { t } = useLingui();

  switch (mode) {
    case "rollover":
      return <Trans>Rollover token {rolloverSerial}</Trans>;
    case "wizard":
      return t`Token enrollment wizard`;
    default:
      return t`Enroll a new token`;
  }
}
