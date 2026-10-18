import dayjs from "dayjs";

import type { TokenProperties } from "./types";
import { formatValidityPeriod, parseValidityPeriod } from "@/lib/dates";

/** The editable token info values while the info row is in edit mode. */
export interface InfoDraft {
  maxAuthCount: string;
  maxSuccessAuthCount: string;
  useTimeShift: string;
  validityEnd: Date | null;
  validityStart: Date | null;
}

export function createInfoDraft(info: Record<string, string>): InfoDraft {
  return {
    maxAuthCount: info.count_auth_max ?? "",
    maxSuccessAuthCount: info.count_auth_success_max ?? "",
    useTimeShift: info.useTimeShift ?? "default",
    validityEnd: parseValidityPeriod(info.validity_period_end),
    validityStart: parseValidityPeriod(info.validity_period_start)
  };
}

/** The `POST /token/set/<serial>` body of a draft; only TOTP knows a timeshift. */
export function infoDraftToProperties(
  draft: InfoDraft,
  tokentype: string
): TokenProperties {
  const properties: TokenProperties = {
    count_auth_max: draft.maxAuthCount,
    count_auth_success_max: draft.maxSuccessAuthCount,
    validity_period_end: formatValidityPeriod(draft.validityEnd),
    validity_period_start: formatValidityPeriod(draft.validityStart)
  };

  if (tokentype === "totp") {
    properties.use_timeshift = draft.useTimeShift;
  }

  return properties;
}

/** A validity period that ends before it starts. */
export function hasInvalidValidityPeriod(draft: InfoDraft): boolean {
  return draft.validityStart && draft.validityEnd
    ? draft.validityStart > draft.validityEnd
    : false;
}

/** Mantine's date pickers hand back a date or a formatted string. */
export function toDate(value: Date | string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = typeof value === "string" ? dayjs(value) : dayjs(value);

  return parsed.isValid() ? parsed.toDate() : null;
}
