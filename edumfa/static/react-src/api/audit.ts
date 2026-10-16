import type { ApiClient } from "./client";

/**
 * Typed port of the AngularJS `AuditFactory`. `getAuditLog` mirrors
 * `AuditFactory.get` and `downloadAuditLog` mirrors `AuditFactory.download`,
 * which streams the audit trail as CSV without the JSON envelope.
 */

export interface AuditLogParams {
  action?: string;
  action_detail?: string;
  administrator?: string;
  client?: string;
  date?: string;
  duration?: string;
  edumfa_server?: string;
  info?: string;
  page?: number;
  page_size?: number;
  policies?: string;
  realm?: string;
  resolver?: string;
  serial?: string;
  sortorder?: "asc" | "desc";
  startdate?: string;
  success?: string;
  timelimit?: string;
  tokentype?: string;
  user?: string;
}

export interface AuditEntry {
  action: string | null;
  action_detail: string | null;
  administrator: string | null;
  clearance_level: string | null;
  client: string | null;
  date: string;
  duration: number | null;
  edumfa_server: string | null;
  info: string | null;
  log_level: string | null;
  missing_line: "FAIL" | "OK";
  number: number;
  policies: string | null;
  realm: string | null;
  resolver: string | null;
  serial: string | null;
  sig_check: "FAIL" | "OK";
  startdate: string | null;
  /** The SQL audit module stores an integer; older entries may carry other spellings. */
  success: boolean | number | string | null;
  thread_id: string | null;
  token_type: string | null;
  user: string | null;
  [key: string]: unknown;
}

export interface AuditLogPage {
  auditcolumns: string[];
  auditdata: AuditEntry[];
  count: number;
  current: number;
  next: number | null;
  prev: number | null;
}

export const auditQueryKeys = {
  all: ["audit"] as const,
  log: (params?: AuditLogParams) => ["audit", "log", params ?? {}] as const
};

export function getAuditLog(
  apiClient: ApiClient,
  params?: AuditLogParams,
  signal?: AbortSignal
): Promise<AuditLogPage> {
  return apiClient.get<AuditLogPage>("/audit/", { params: { ...params }, signal });
}

export function downloadAuditLog(
  apiClient: ApiClient,
  params?: AuditLogParams,
  filename = "audit.csv",
  signal?: AbortSignal
): Promise<string> {
  return apiClient.get<string>(`/audit/${encodeURIComponent(filename)}`, {
    params: { ...params },
    responseType: "text",
    signal
  });
}

/** Normalizes the audit `success` column, which the API delivers as `1`/`0`. */
export function isAuditSuccess(entry: Pick<AuditEntry, "success">): boolean | null {
  const { success } = entry;

  if (success === null || success === "") {
    return null;
  }

  return success === true || success === 1 || success === "1" || success === "OK";
}
