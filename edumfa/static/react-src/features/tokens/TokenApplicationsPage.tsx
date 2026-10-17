import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, NativeSelect, Text } from "@mantine/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { TokenSidebar } from "./TokenSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  getMachineTokens,
  machineQueryKeys,
  type MachineTokenAssignment,
  type MachineTokenParams
} from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort
} from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";
import { hashHref } from "@/lib/hashbang";
import { toContainsWildcard } from "@/lib/strings";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Fixed in the legacy templates (`items-per-page="15"`). */
const PAGE_SIZE = 15;

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

type ApplicationName = "offline" | "ssh";

type ApplicationFilterName = "count" | "rounds" | "serial" | "service_id" | "user";

type ApplicationFilters = Partial<Record<ApplicationFilterName, string>>;

const defaultSort: DataTableSort = { by: "serial", direction: "asc" };

/**
 * Port of `token.applications.html` with its per-application tables
 * (`token.applications.ssh.html`, `token.applications.offline.html`). The
 * application is part of the route; filters and sorting go to
 * `GET /machine/token`, paging stays client-side because the endpoint
 * returns the whole list.
 */
export function TokenApplicationsPage() {
  const { application: applicationParam = "ssh" } = useParams();
  const application: ApplicationName =
    applicationParam === "offline" ? "offline" : "ssh";
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { isAuthenticated, settings } = useAuth();
  const filterState = useDebouncedState<ApplicationFilters>({}, FILTER_DEBOUNCE_MS, {
    liveApply: !settings.searchOnEnter
  });
  const {
    applied: appliedFilters,
    apply: applyFilters,
    draft: draftFilters
  } = filterState;
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort>(defaultSort);

  const params = useMemo<MachineTokenParams>(() => {
    const requestParams: MachineTokenParams = {
      application,
      sortby: sort.by,
      sortdir: sort.direction
    };

    for (const [name, value] of Object.entries(appliedFilters) as [
      ApplicationFilterName,
      string
    ][]) {
      if (value) {
        requestParams[name] = toContainsWildcard(value);
      }
    }

    return requestParams;
  }, [application, appliedFilters, sort]);

  const tokensQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachineTokens(apiClient, params, signal),
    queryKey: machineQueryKeys.tokens(params)
  });

  const assignments = tokensQuery.data ?? [];
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleAssignments = assignments.slice(pageStart, pageStart + PAGE_SIZE);

  const filterFor = (name: ApplicationFilterName, label: string) => (
    <ColumnFilter
      label={label}
      onChange={(value) => {
        setPage(1);
        filterState.setDraft((previous) => ({ ...previous, [name]: value }));
      }}
      onSubmit={() => {
        applyFilters();
      }}
      value={draftFilters[name] ?? ""}
    />
  );

  const serialColumn: DataTableColumn<MachineTokenAssignment> = {
    filter: filterFor("serial", t`serial`),
    header: <Trans>serial</Trans>,
    key: "serial",
    render: (assignment) => (
      <Anchor
        href={hashHref(`/token/details/${encodeURIComponent(assignment.serial)}`)}
        size="sm"
      >
        {assignment.serial}
      </Anchor>
    ),
    sortKey: "serial"
  };
  const columns: DataTableColumn<MachineTokenAssignment>[] =
    application === "ssh"
      ? [
          serialColumn,
          {
            filter: filterFor("service_id", t`Service ID`),
            header: <Trans>Service ID</Trans>,
            key: "service_id",
            render: (assignment) => assignment.options.service_id,
            sortKey: "service_id"
          },
          {
            filter: filterFor("user", t`SSH user`),
            header: <Trans>SSH user</Trans>,
            key: "user",
            render: (assignment) => assignment.options.user,
            sortKey: "user"
          }
        ]
      : [
          serialColumn,
          {
            filter: filterFor("count", t`Count`),
            header: <Trans>Count</Trans>,
            key: "count",
            render: (assignment) => assignment.options.count,
            sortKey: "count"
          },
          {
            filter: filterFor("rounds", t`Rounds`),
            header: <Trans>Rounds</Trans>,
            key: "rounds",
            render: (assignment) => assignment.options.rounds,
            sortKey: "rounds"
          }
        ];

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="applications" />}>
      <PageHeader
        subtitle={
          application === "ssh" ? (
            <Trans>
              SSH Tokens can be attached to a service ID with a user. The user is the
              user on the SSH server and may differ from the token owner. To attach the
              token to a service ID go to the token details.
            </Trans>
          ) : (
            <Trans>HOTP tokens can be attached with offline to e.g. notebooks.</Trans>
          )
        }
        title={
          application === "ssh" ? (
            <Trans>SSH Tokens attached to services</Trans>
          ) : (
            <Trans>Offline tokens attached to notebooks</Trans>
          )
        }
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={tokensQuery.error} />

      <Card>
        <NativeSelect
          data={[
            { label: t`SSH: Attaching ssh keys to services.`, value: "ssh" },
            {
              label: t`offline: Use HOTP token for offline login to notebooks.`,
              value: "offline"
            }
          ]}
          id="token_application"
          label={<Trans>Application</Trans>}
          onChange={(event) => {
            setPage(1);
            applyFilters({});
            void navigate(`/token/applications/${event.currentTarget.value}`);
          }}
          value={application}
        />
        {application === "ssh" ? (
          <Text mt="sm" size="sm">
            <Trans>
              To define service IDs go to{" "}
              <Anchor href={hashHref("/config/serviceid")} size="sm">
                Service ID config
              </Anchor>
            </Trans>
          </Text>
        ) : null}
      </Card>

      <Card flush>
        {tokensQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading tokens</Trans>} />
        ) : null}

        <Pagination
          currentPage={page}
          maxSize={5}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
          totalCount={assignments.length}
        />

        <DataTable
          columns={columns}
          data={visibleAssignments}
          emptyMessage={<Trans>No tokens attached.</Trans>}
          getRowKey={(assignment) => String(assignment.id)}
          id="tablemachinetokens"
          isLoading={tokensQuery.data === undefined}
          minWidth={640}
          onSortChange={(nextSort) => {
            setPage(1);
            setSort(nextSort);
          }}
          sort={sort}
        />
      </Card>
    </SidebarLayout>
  );
}
