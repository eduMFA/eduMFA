import { Trans, useLingui } from "@lingui/react/macro";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  NativeSelect,
  Text
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar, IconDownload, IconFilterOff, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
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
} from "@/api/audit";
import { useApiClient } from "@/api/ApiClientProvider";
import { useAuth } from "@/auth/AuthProvider";
import { BooleanPill } from "@/components/feedback/BooleanPill";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";
import { formatLegacyDate } from "@/lib/dates";
import { saveTextAsFile } from "@/lib/download";
import { hashHref } from "@/lib/hashbang";
import { toContainsWildcard } from "@/lib/strings";
import { useDebouncedState } from "@/lib/useDebouncedState";

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
  const { isAuthenticated, rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  // The legacy audit state accepted ?serial and ?user to open the log
  // pre-filtered from the token and user detail views.
  const [searchParams] = useSearchParams();
  const filterState = useDebouncedState<AuditFilters>(
    () => readInitialFilters(searchParams),
    FILTER_DEBOUNCE_MS,
    { liveApply: !settings.searchOnEnter }
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
      page_size: settings.auditPageSize,
      sortorder: "desc",
      ...toAuditParams(appliedFilters)
    }),
    [appliedFilters, page, settings.auditPageSize]
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
      saveTextAsFile(csv, "audit.csv", "text/csv;charset=utf-8");
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

  const renderFilter = (filterName: AuditFilterName): ReactNode => {
    if (filterName === "success") {
      return (
        <NativeSelect
          aria-label={filterName}
          data={[
            { label: t`any`, value: "" },
            { label: t`yes`, value: "1" },
            { label: t`no`, value: "0" }
          ]}
          onChange={(event) => {
            replaceFilters({ ...draftFilters, success: event.currentTarget.value });
          }}
          size="xs"
          value={draftFilters.success ?? ""}
        />
      );
    }

    if (filterName === "date" || filterName === "startdate") {
      return (
        <DatePickerInput
          aria-label={filterName}
          clearable
          leftSection={<IconCalendar size={14} />}
          leftSectionPointerEvents="none"
          onChange={(value) => {
            replaceFilters({ ...draftFilters, [filterName]: formatDateFilter(value) });
          }}
          placeholder={t`Pick a date`}
          size="xs"
          value={draftFilters[filterName] || null}
          valueFormat="YYYY-MM-DD"
        />
      );
    }

    return (
      <ColumnFilter
        label={filterName}
        onChange={(value) => {
          setDraftFilter(filterName, value);
        }}
        onSubmit={() => {
          applyFilters();
        }}
        value={draftFilters[filterName] ?? ""}
      />
    );
  };

  const columns: DataTableColumn<AuditEntry>[] = auditColumnConfigs
    .filter(
      (column) => auditColumns.includes(column.key) && (!column.adminOnly || isAdmin)
    )
    .map((column) => ({
      filter: column.filterName ? renderFilter(column.filterName) : null,
      header: column.label,
      key: column.key,
      nowrap: column.nowrap,
      render: (entry) => column.render(entry, isAdmin)
    }));

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
    <Box className="react-migration-shell">
      <PageHeader
        actions={
          canDownload ? (
            <Button
              leftSection={<IconDownload size={16} />}
              loading={downloadMutation.isPending}
              onClick={() => {
                downloadMutation.mutate();
              }}
              variant="default"
            >
              {downloadMutation.isPending ? (
                <Trans>Please Wait! Crunching data...</Trans>
              ) : (
                <Trans>Download audit log as CSV</Trans>
              )}
            </Button>
          ) : null
        }
        subtitle={auditPage ? <Trans>{entryCount} entries found.</Trans> : null}
        title={<Trans>Audit log</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={auditQuery.error} />
      <ErrorAlert error={downloadMutation.error} />

      <Card flush>
        {activeFilters.length > 0 ? (
          <Group
            aria-label={t`Active filters`}
            gap="xs"
            px="md"
            py="sm"
            role="group"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Text c="dimmed" fw={600} size="xs" tt="uppercase">
              <Trans>Filters</Trans>
            </Text>
            {activeFilters.map(([name, value]) => (
              <Badge
                data-chip={name}
                key={name}
                rightSection={
                  <ActionIcon
                    aria-label={t`Remove filter ${name}`}
                    onClick={() => {
                      replaceFilters({ ...appliedFilters, [name]: "" });
                    }}
                    size="xs"
                    variant="transparent"
                  >
                    <IconX size={12} />
                  </ActionIcon>
                }
                size="lg"
                tt="none"
                variant="light"
              >
                {getFilterLabel(name)}: {describeFilterValue(name, value)}
              </Badge>
            ))}
            <Button
              leftSection={<IconFilterOff size={14} />}
              onClick={() => {
                replaceFilters({});
              }}
              size="compact-xs"
              variant="subtle"
            >
              <Trans>Clear all filters</Trans>
            </Button>
          </Group>
        ) : null}

        {auditQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading audit log</Trans>} />
        ) : null}

        <Pagination
          currentPage={page}
          onPageChange={setPage}
          pageSize={settings.auditPageSize}
          totalCount={entryCount}
        />

        {auditPage ? (
          <DataTable
            columns={columns}
            data={auditPage.auditdata}
            emptyMessage={<Trans>No audit entries match the current filters.</Trans>}
            getRowKey={(entry) => String(entry.number)}
            id="tableauditlog"
            isLoading={auditQuery.isLoading}
            minWidth={Math.max(900, columns.length * 130)}
          />
        ) : null}
      </Card>
    </Box>
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

    requestParams[name] = name === "success" ? value : toContainsWildcard(value);
  }

  return requestParams;
}

function getFilterLabel(name: AuditFilterName): ReactNode {
  return auditColumnConfigs.find((column) => column.filterName === name)?.label ?? name;
}

interface AuditColumnConfig {
  adminOnly?: boolean;
  filterName?: AuditFilterName;
  key: string;
  label: ReactNode;
  nowrap?: boolean;
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
    <Group gap={4}>
      {serial.split(",").map((singleSerial, index) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(singleSerial)}`)}
          key={`${singleSerial}-${String(index)}`}
          size="sm"
        >
          {singleSerial}
        </Anchor>
      ))}
    </Group>
  );
}

function PolicyLinks({ policies }: { policies: string | null }) {
  if (!policies) {
    return null;
  }

  const uniquePolicies = [...new Set(policies.split(","))];

  return (
    <Group gap={4}>
      {uniquePolicies.map((policy) =>
        policy.endsWith("+") ? (
          <span key={policy}>{policy}</span>
        ) : (
          <Anchor
            href={hashHref(`/config/policies/details/${encodeURIComponent(policy)}`)}
            key={policy}
            size="sm"
          >
            {policy}
          </Anchor>
        )
      )}
    </Group>
  );
}

const auditColumnConfigs: AuditColumnConfig[] = [
  {
    key: "number",
    label: <Trans>number</Trans>,
    nowrap: true,
    render: (entry) => entry.number
  },
  {
    filterName: "startdate",
    key: "startdate",
    label: <Trans>startdate</Trans>,
    nowrap: true,
    render: (entry) => formatLegacyDate(entry.startdate)
  },
  {
    filterName: "date",
    key: "date",
    label: <Trans>enddate</Trans>,
    nowrap: true,
    render: (entry) => formatLegacyDate(entry.date)
  },
  {
    filterName: "duration",
    key: "duration",
    label: <Trans>duration</Trans>,
    nowrap: true,
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
        <Anchor
          href={hashHref(
            `/user/details/${encodeURIComponent(entry.realm ?? "")}/${encodeURIComponent(entry.user)}`
          )}
          size="sm"
        >
          {entry.user}
        </Anchor>
      ) : null
  },
  {
    filterName: "realm",
    key: "realm",
    label: <Trans>realm</Trans>,
    render: (entry, isAdmin) =>
      isAdmin && entry.realm ? (
        <Anchor href={hashHref("/config/realms/list")} size="sm">
          {entry.realm}
        </Anchor>
      ) : (
        entry.realm
      )
  },
  {
    filterName: "resolver",
    key: "resolver",
    label: <Trans>resolver</Trans>,
    render: (entry, isAdmin) =>
      isAdmin && entry.resolver ? (
        <Anchor href={hashHref("/config/resolvers/list")} size="sm">
          {entry.resolver}
        </Anchor>
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

/** The backend matches dates as ISO strings, so a picked day becomes `*YYYY-MM-DD*`. */
function formatDateFilter(value: Date | string | null): string {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : dayjs(value).format("YYYY-MM-DD");
}
