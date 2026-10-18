import dayjs from "dayjs";

import { toContainsWildcard } from "@/lib/strings";

export type AuditFilterName =
  | "action"
  | "action_detail"
  | "administrator"
  | "client"
  | "date"
  | "duration"
  | "edumfa_server"
  | "info"
  | "policies"
  | "realm"
  | "resolver"
  | "serial"
  | "startdate"
  | "success"
  | "tokentype"
  | "user";

export type AuditFilters = Partial<Record<AuditFilterName, string>>;

/** `?serial` and `?user` open the log pre-filtered, like the legacy audit state. */
export function readInitialFilters(searchParams: URLSearchParams): AuditFilters {
  const initialFilters: AuditFilters = {};
  const initialSerial = searchParams.get("serial");
  const initialUser = searchParams.get("user");

  if (initialSerial) {
    initialFilters.serial = initialSerial;
  }

  if (initialUser) {
    initialFilters.user = initialUser;
  }

  return initialFilters;
}

/**
 * Builds the request parameters. Text filters match "contains" like the
 * legacy `getParams`, unless the value already carries `*` wildcards, in
 * which case it is sent as typed. `success` is a boolean on the backend.
 */
export function toAuditParams(filters: AuditFilters): AuditFilters {
  const requestParams: AuditFilters = {};

  for (const [name, value] of Object.entries(filters) as [AuditFilterName, string][]) {
    if (!value) {
      continue;
    }

    requestParams[name] = name === "success" ? value : toContainsWildcard(value);
  }

  return requestParams;
}

/** The backend matches dates as ISO strings, so a picked day becomes `*YYYY-MM-DD*`. */
export function formatDateFilter(value: Date | string | null): string {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : dayjs(value).format("YYYY-MM-DD");
}
