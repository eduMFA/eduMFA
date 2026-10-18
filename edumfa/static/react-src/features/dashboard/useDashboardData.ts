import { useQueries, useQuery } from "@tanstack/react-query";

import { summarizeFailures, type FailureSummary } from "./summarizeFailures";
import { useTokenCounts, type TokenCounts } from "./useTokenCounts";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  auditQueryKeys,
  getAuditLog,
  type AuditEntry,
  type AuditLogParams
} from "@/api/audit";
import {
  configQueryKeys,
  getEvents,
  getPolicies,
  type EventSummary,
  type PolicySummary
} from "@/api/config";

/** The administrative actions the legacy dashboard listed. */
const administrationActions = ["system", "resolver", "realm", "policy", "event"];

export interface DashboardPermissions {
  canListTokens: boolean;
  canReadAudit: boolean;
  canReadEvents: boolean;
  canReadPolicies: boolean;
}

export interface DashboardData {
  activeEvents: EventSummary[];
  activePolicies: PolicySummary[];
  /** The latest five administrative requests of the last day. */
  administration: AuditEntry[];
  failureCount: number | undefined;
  failures: FailureSummary;
  /** The error of the first failed query, if any. */
  firstError: Error | null | undefined;
  inactiveEvents: EventSummary[];
  inactivePolicies: PolicySummary[];
  successCount: number | undefined;
  tokenCounts: TokenCounts;
}

/** All dashboard queries; each one is gated by the right the legacy panel had. */
export function useDashboardData({
  canListTokens,
  canReadAudit,
  canReadEvents,
  canReadPolicies
}: DashboardPermissions): DashboardData {
  const apiClient = useApiClient();
  const tokenCounts = useTokenCounts(canListTokens);

  const successParams: AuditLogParams = {
    action: "*validate/*check",
    success: "1",
    timelimit: "1d"
  };
  const failureParams: AuditLogParams = {
    action: "*validate/*check",
    success: "0",
    timelimit: "1d"
  };
  const successQuery = useQuery({
    enabled: canReadAudit,
    queryFn: ({ signal }) => getAuditLog(apiClient, successParams, signal),
    queryKey: auditQueryKeys.log(successParams)
  });
  const failureQuery = useQuery({
    enabled: canReadAudit,
    queryFn: ({ signal }) => getAuditLog(apiClient, failureParams, signal),
    queryKey: auditQueryKeys.log(failureParams)
  });

  const administrationQueries = useQueries({
    queries: administrationActions.map((action) => {
      const params: AuditLogParams = { action: `POST /${action}*`, timelimit: "1d" };

      return {
        enabled: canReadAudit,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAuditLog(apiClient, params, signal),
        queryKey: auditQueryKeys.log(params)
      };
    })
  });
  const administration = administrationQueries
    .flatMap((query) => query.data?.auditdata ?? [])
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);

  const policiesQuery = useQuery({
    enabled: canReadPolicies,
    queryFn: ({ signal }) => getPolicies(apiClient, signal),
    queryKey: configQueryKeys.policies
  });
  const eventsQuery = useQuery({
    enabled: canReadEvents,
    queryFn: ({ signal }) => getEvents(apiClient, signal),
    queryKey: configQueryKeys.events
  });
  const policies = policiesQuery.data ?? [];
  const events = eventsQuery.data ?? [];

  const firstError = [
    ...tokenCounts.queries,
    successQuery,
    failureQuery,
    ...administrationQueries,
    policiesQuery,
    eventsQuery
  ].find((query) => query.error)?.error;

  return {
    activeEvents: events.filter((event) => event.active),
    activePolicies: policies.filter((policy) => policy.active),
    administration,
    failureCount: failureQuery.data?.count,
    failures: summarizeFailures(failureQuery.data?.auditdata ?? []),
    firstError,
    inactiveEvents: events.filter((event) => !event.active),
    inactivePolicies: policies.filter((policy) => !policy.active),
    successCount: successQuery.data?.count,
    tokenCounts: tokenCounts.counts
  };
}
