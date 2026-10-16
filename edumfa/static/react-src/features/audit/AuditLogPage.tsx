import { Trans, useLingui } from "@lingui/react/macro";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import {
  auditQueryKeys,
  downloadAuditLog,
  getAuditLog,
  isAuditSuccess,
  type AuditEntry,
  type AuditLogParams
} from "../../api/audit";
import { useApiClient } from "../../api/ApiClientProvider";
import { useAuth } from "../../auth/AuthProvider";
import { BooleanPill } from "../../components/feedback/BooleanPill";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { ColumnFilter } from "../../components/tables/ColumnFilter";
import { EmptyState } from "../../components/tables/EmptyState";
import { Pagination } from "../../components/tables/Pagination";
import { formatLegacyDate } from "../../lib/dates";
import { hashHref } from "../../lib/hashbang";
import { useDebouncedState } from "../../lib/useDebouncedState";

/**
 * Default page size. The legacy UI could raise this through the
 * `audit_page_size` WebUI policy, which is delivered with the login response;
 * wiring that policy in React is deferred until React owns the login flow.
 */
const AUDIT_PAGE_SIZE = 10;

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

type AuditFilterName =
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

type AuditFilters = Partial<Record<AuditFilterName, string>>;

export function AuditLogPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  // The legacy audit state accepted ?serial and ?user to open the log
  // pre-filtered from the token and user detail views.
  const [searchParams] = useSearchParams();
  const filterState = useDebouncedState<AuditFilters>(
    () => readInitialFilters(searchParams),
    FILTER_DEBOUNCE_MS
  );
  const {
    applied: appliedFilters,
    apply: applyFilters,
    draft: draftFilters
  } = filterState;
  const [page, setPage] = useState(1);

  const params = useMemo<AuditLogParams>(
    () => ({
      page,
      page_size: AUDIT_PAGE_SIZE,
      sortorder: "desc",
      ...toAuditParams(appliedFilters)
    }),
    [appliedFilters, page]
  );

  const auditQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getAuditLog(apiClient, params, signal),
    queryKey: auditQueryKeys.log(params)
  });

  const downloadMutation = useMutation({
    mutationFn: () => downloadAuditLog(apiClient, toAuditParams(appliedFilters)),
    onSuccess: (csv) => {
      saveTextAsFile(csv, "audit.csv");
    }
  });

  const auditPage = auditQuery.data;
  const auditColumns = auditPage?.auditcolumns ?? [];
  const canDownload = isAdmin && rights.includes("auditlog_download");
  const entryCount = auditPage?.count ?? 0;

  const setDraftFilter = (name: AuditFilterName, value: string) => {
    setPage(1);
    filterState.setDraft((previousFilters) => ({ ...previousFilters, [name]: value }));
  };

  const replaceFilters = (nextFilters: AuditFilters) => {
    setPage(1);
    applyFilters(nextFilters);
  };

  const visibleColumns = auditColumnConfigs.filter(
    (column) => auditColumns.includes(column.key) && (!column.adminOnly || isAdmin)
  );
  const activeFilters = (
    Object.entries(appliedFilters) as [AuditFilterName, string][]
  ).filter(([, value]) => value.length > 0);

  const describeFilterValue = (name: AuditFilterName, value: string): string => {
    if (name === "success") {
      return value === "1" ? t`yes` : t`no`;
    }

    return value;
  };

  return (
    <div className="react-migration-shell">
      <PageHeader
        actions={
          canDownload ? (
            <button
              className="btn btn-default"
              disabled={downloadMutation.isPending}
              onClick={() => {
                downloadMutation.mutate();
              }}
              type="button"
            >
              <span className="glyphicon glyphicon-download-alt" aria-hidden="true" />
              {downloadMutation.isPending ? (
                <Trans>Please Wait! Crunching data...</Trans>
              ) : (
                <Trans>Download audit log as CSV</Trans>
              )}
            </button>
          ) : null
        }
        subtitle={auditPage ? <Trans>{entryCount} entries found.</Trans> : null}
        title={<Trans>Audit log</Trans>}
      />

      {!isAuthenticated ? (
        <div className="alert alert-warning" role="alert">
          <Trans>
            Log in through the legacy UI before opening this migrated route.
          </Trans>
        </div>
      ) : null}

      <ErrorAlert error={auditQuery.error} />
      <ErrorAlert error={downloadMutation.error} />

      <Card flush>
        {activeFilters.length > 0 ? (
          <div className="react-filter-bar" role="group" aria-label={t`Active filters`}>
            <span className="react-filter-bar__label">
              <Trans>Filters</Trans>
            </span>
            {activeFilters.map(([name, value]) => (
              <span className="react-chip" key={name}>
                {getFilterLabel(name)}: {describeFilterValue(name, value)}
                <button
                  aria-label={t`Remove filter ${name}`}
                  className="react-chip__remove"
                  onClick={() => {
                    replaceFilters({ ...appliedFilters, [name]: "" });
                  }}
                  type="button"
                >
                  &times;
                </button>
              </span>
            ))}
            <button
              className="btn btn-link btn-xs"
              onClick={() => {
                replaceFilters({});
              }}
              type="button"
            >
              <Trans>Clear all filters</Trans>
            </button>
          </div>
        ) : null}

        {auditQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading audit log</Trans>} />
        ) : null}

        <Pagination
          currentPage={page}
          onPageChange={setPage}
          pageSize={AUDIT_PAGE_SIZE}
          totalCount={entryCount}
        />

        {auditPage ? (
          <div className="table-responsive">
            <table className="table table-bordered table-striped" id="tableauditlog">
              <thead>
                <tr>
                  {visibleColumns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
                <tr className="react-filter-row">
                  {visibleColumns.map((column) => {
                    const filterName = column.filterName;

                    if (!filterName) {
                      return <th key={column.key} />;
                    }

                    if (filterName === "success") {
                      return (
                        <th key={column.key}>
                          <select
                            aria-label={filterName}
                            className="form-control input-sm"
                            onChange={(event) => {
                              replaceFilters({
                                ...draftFilters,
                                success: event.target.value
                              });
                            }}
                            value={draftFilters.success ?? ""}
                          >
                            <option value="">{t`any`}</option>
                            <option value="1">{t`yes`}</option>
                            <option value="0">{t`no`}</option>
                          </select>
                        </th>
                      );
                    }

                    return (
                      <th key={column.key}>
                        <ColumnFilter
                          label={filterName}
                          onChange={(value) => {
                            setDraftFilter(filterName, value);
                          }}
                          onSubmit={() => {
                            applyFilters();
                          }}
                          placeholder={column.filterPlaceholder}
                          value={draftFilters[filterName] ?? ""}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {auditPage.auditdata.length === 0 ? (
                  <EmptyState
                    colSpan={visibleColumns.length}
                    message={<Trans>No audit entries match the current filters.</Trans>}
                  />
                ) : (
                  auditPage.auditdata.map((entry) => (
                    <tr key={entry.number}>
                      {visibleColumns.map((column) => (
                        <td key={column.key}>{column.render(entry, isAdmin)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function readInitialFilters(searchParams: URLSearchParams): AuditFilters {
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
function toAuditParams(filters: AuditFilters): AuditFilters {
  const requestParams: AuditFilters = {};

  for (const [name, value] of Object.entries(filters) as [AuditFilterName, string][]) {
    if (!value) {
      continue;
    }

    if (name === "success" || value.includes("*")) {
      requestParams[name] = value;
    } else {
      requestParams[name] = `*${value}*`;
    }
  }

  return requestParams;
}

function getFilterLabel(name: AuditFilterName): ReactNode {
  return auditColumnConfigs.find((column) => column.filterName === name)?.label ?? name;
}

function saveTextAsFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

interface AuditColumnConfig {
  adminOnly?: boolean;
  filterName?: AuditFilterName;
  filterPlaceholder?: string;
  key: string;
  label: ReactNode;
  render: (entry: AuditEntry, isAdmin: boolean) => ReactNode;
}

function CheckLabel({ value }: { value: "FAIL" | "OK" | null | undefined }) {
  if (!value) {
    return null;
  }

  return <BooleanPill falseLabel="FAIL" trueLabel="OK" value={value === "OK"} />;
}

function SerialLinks({ serial }: { serial: string | null }) {
  if (!serial) {
    return null;
  }

  return (
    <>
      {serial.split(",").map((singleSerial, index) => (
        <a
          href={hashHref(`/token/details/${encodeURIComponent(singleSerial)}`)}
          key={`${singleSerial}-${String(index)}`}
        >
          {singleSerial}{" "}
        </a>
      ))}
    </>
  );
}

function PolicyLinks({ policies }: { policies: string | null }) {
  if (!policies) {
    return null;
  }

  const uniquePolicies = [...new Set(policies.split(","))];

  return (
    <>
      {uniquePolicies.map((policy) =>
        policy.endsWith("+") ? (
          <span key={policy}>{policy} </span>
        ) : (
          <a
            href={hashHref(`/config/policies/details/${encodeURIComponent(policy)}`)}
            key={policy}
          >
            {policy}{" "}
          </a>
        )
      )}
    </>
  );
}

const auditColumnConfigs: AuditColumnConfig[] = [
  {
    key: "number",
    label: <Trans>number</Trans>,
    render: (entry) => entry.number
  },
  {
    filterName: "startdate",
    filterPlaceholder: "YYYY-MM-DD",
    key: "startdate",
    label: <Trans>startdate</Trans>,
    render: (entry) => formatLegacyDate(entry.startdate)
  },
  {
    filterName: "date",
    filterPlaceholder: "YYYY-MM-DD",
    key: "date",
    label: <Trans>enddate</Trans>,
    render: (entry) => formatLegacyDate(entry.date)
  },
  {
    filterName: "duration",
    key: "duration",
    label: <Trans>duration</Trans>,
    render: (entry) => entry.duration
  },
  {
    filterName: "action",
    key: "action",
    label: <Trans>action</Trans>,
    render: (entry) => entry.action
  },
  {
    filterName: "success",
    key: "success",
    label: <Trans>success</Trans>,
    render: (entry) => (
      <BooleanPill
        falseLabel={<Trans>failed</Trans>}
        trueLabel={<Trans>success</Trans>}
        value={isAuditSuccess(entry)}
      />
    )
  },
  {
    filterName: "action_detail",
    key: "action_detail",
    label: <Trans>action detail</Trans>,
    render: (entry) => entry.action_detail
  },
  {
    filterName: "serial",
    key: "serial",
    label: <Trans>serial</Trans>,
    render: (entry) => <SerialLinks serial={entry.serial} />
  },
  {
    filterName: "tokentype",
    key: "token_type",
    label: <Trans>token type</Trans>,
    render: (entry) => entry.token_type
  },
  {
    filterName: "administrator",
    key: "administrator",
    label: <Trans>administrator</Trans>,
    render: (entry) => entry.administrator
  },
  {
    filterName: "user",
    key: "user",
    label: <Trans>user</Trans>,
    render: (entry) =>
      entry.user ? (
        <a
          href={hashHref(
            `/user/details/${encodeURIComponent(entry.realm ?? "")}/${encodeURIComponent(entry.user)}`
          )}
        >
          {entry.user}
        </a>
      ) : null
  },
  {
    filterName: "realm",
    key: "realm",
    label: <Trans>realm</Trans>,
    render: (entry, isAdmin) =>
      isAdmin ? (
        <a href={hashHref("/config/realms/list")}>{entry.realm}</a>
      ) : (
        entry.realm
      )
  },
  {
    filterName: "resolver",
    key: "resolver",
    label: <Trans>resolver</Trans>,
    render: (entry, isAdmin) =>
      isAdmin ? (
        <a href={hashHref("/config/resolvers/list")}>{entry.resolver}</a>
      ) : (
        entry.resolver
      )
  },
  {
    adminOnly: true,
    filterName: "policies",
    key: "policies",
    label: <Trans>policies</Trans>,
    render: (entry) => <PolicyLinks policies={entry.policies} />
  },
  {
    filterName: "client",
    key: "client",
    label: <Trans>client</Trans>,
    render: (entry) => entry.client
  },
  {
    filterName: "info",
    key: "info",
    label: <Trans>info</Trans>,
    render: (entry) => entry.info
  },
  {
    key: "sig_check",
    label: <Trans>sig_check</Trans>,
    render: (entry) => <CheckLabel value={entry.sig_check} />
  },
  {
    key: "missing_line",
    label: <Trans>missing_line</Trans>,
    render: (entry) => <CheckLabel value={entry.missing_line} />
  },
  {
    key: "thread_id",
    label: <Trans>thread_id</Trans>,
    render: (entry) => entry.thread_id
  },
  {
    key: "clearance_level",
    label: <Trans>clearance</Trans>,
    render: (entry) => entry.clearance_level
  },
  {
    key: "log_level",
    label: <Trans>log level</Trans>,
    render: (entry) => entry.log_level
  },
  {
    filterName: "edumfa_server",
    key: "edumfa_server",
    label: <Trans>eduMFA server</Trans>,
    render: (entry) => entry.edumfa_server
  }
];
