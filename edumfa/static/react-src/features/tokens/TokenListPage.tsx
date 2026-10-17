import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Group } from "@mantine/core";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { FailCounterBadge, TokenActiveBadge } from "./tokenBadges";
import { TokenSidebar } from "./TokenSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  disableToken,
  enableToken,
  getTokens,
  resetFailCounter,
  tokenQueryKeys,
  type TokenDetail,
  type TokenListParams
} from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
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
import { popFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { notify } from "@/lib/notify";
import { toContainsWildcard } from "@/lib/strings";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

type TokenFilterName =
  "description" | "rollout_state" | "serial" | "tokenrealm" | "type";

type TokenFilters = Partial<Record<TokenFilterName, string>>;

/** The backend default (`sortby=serial`), made explicit so the header shows it. */
const defaultSort: DataTableSort = { by: "serial", direction: "asc" };

/**
 * Port of `token.list.html`: the paginated, sortable token table with the
 * inline enable/disable and fail counter reset actions. Paging, sorting and
 * filtering stay on the server like in the legacy controller.
 */
export function TokenListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { isAuthenticated, rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const filterState = useDebouncedState<TokenFilters>({}, FILTER_DEBOUNCE_MS, {
    liveApply: !settings.searchOnEnter
  });
  const {
    applied: appliedFilters,
    apply: applyFilters,
    draft: draftFilters
  } = filterState;
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort>(defaultSort);

  // Notices handed over by the assign page, e.g. "Token assigned successfully."
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const params = useMemo<TokenListParams>(
    () => ({
      page,
      pagesize: settings.tokenPageSize,
      sortby: sort.by,
      sortdir: sort.direction,
      ...toTokenParams(appliedFilters)
    }),
    [appliedFilters, page, settings.tokenPageSize, sort]
  );

  const tokensQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getTokens(apiClient, params, signal),
    queryKey: tokenQueryKeys.list(params)
  });

  const invalidateTokens = () =>
    queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
  const toggleActiveMutation = useMutation({
    mutationFn: (token: TokenDetail) =>
      token.active
        ? disableToken(apiClient, token.serial)
        : enableToken(apiClient, token.serial),
    onSuccess: invalidateTokens
  });
  const resetMutation = useMutation({
    mutationFn: (serial: string) => resetFailCounter(apiClient, serial),
    onSuccess: invalidateTokens
  });

  const tokenPage = tokensQuery.data;
  const tokenCount = tokenPage?.count ?? 0;
  const canReset = hasRight(rights, "reset");

  const setDraftFilter = (name: TokenFilterName, value: string) => {
    setPage(1);
    filterState.setDraft((previousFilters) => ({ ...previousFilters, [name]: value }));
  };

  const filterFor = (name: TokenFilterName, label: string) => (
    <ColumnFilter
      label={label}
      onChange={(value) => {
        setDraftFilter(name, value);
      }}
      onSubmit={() => {
        applyFilters();
      }}
      value={draftFilters[name] ?? ""}
    />
  );

  const columns: DataTableColumn<TokenDetail>[] = [
    {
      filter: filterFor("serial", t`serial`),
      header: <Trans>serial</Trans>,
      key: "serial",
      render: (token) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(token.serial)}`)}
          size="sm"
        >
          {token.serial}
        </Anchor>
      ),
      sortKey: "serial"
    },
    {
      filter: filterFor("type", t`type`),
      header: <Trans>type</Trans>,
      key: "tokentype",
      render: (token) => token.tokentype,
      sortKey: "tokentype"
    },
    {
      header: <Trans>active</Trans>,
      key: "active",
      render: (token) => (
        <TokenActiveBadge
          active={token.active}
          onToggle={
            hasRight(rights, token.active ? "disable" : "enable")
              ? () => {
                  toggleActiveMutation.mutate(token);
                }
              : undefined
          }
        />
      ),
      sortKey: "active"
    },
    {
      filter: filterFor("description", t`description`),
      header: <Trans>description</Trans>,
      key: "description",
      render: (token) => token.description,
      sortKey: "description"
    },
    {
      header: <Trans>failcounter</Trans>,
      key: "failcount",
      render: (token) => (
        <FailCounterBadge
          onReset={
            canReset
              ? () => {
                  resetMutation.mutate(token.serial);
                }
              : undefined
          }
          token={token}
        />
      ),
      sortKey: "failcount"
    },
    {
      filter: filterFor("rollout_state", t`rollout state`),
      header: <Trans>rollout state</Trans>,
      key: "rollout_state",
      render: (token) => token.rollout_state,
      sortKey: "rollout_state"
    }
  ];

  if (isAdmin) {
    columns.push(
      {
        header: <Trans>user</Trans>,
        key: "username",
        render: (token) =>
          token.username ? (
            <Anchor
              href={hashHref(
                `/user/details/${encodeURIComponent(token.user_realm)}/${encodeURIComponent(token.username)}`
              )}
              size="sm"
            >
              {token.username}
            </Anchor>
          ) : null
      },
      {
        header: <Trans>realm</Trans>,
        key: "user_realm",
        render: (token) =>
          token.user_realm ? (
            <Anchor href={hashHref("/config/realms/list")} size="sm">
              {token.user_realm}
            </Anchor>
          ) : null
      },
      {
        filter: filterFor("tokenrealm", t`Token realms`),
        header: <Trans>Token realms</Trans>,
        key: "realms",
        render: (token) => (
          <Group gap={4}>
            {token.realms.map((realm) => (
              <Anchor href={hashHref("/config/realms/list")} key={realm} size="sm">
                {realm}
              </Anchor>
            ))}
          </Group>
        )
      }
    );
  }

  // The `user_details` WebUI policy adds the resolver-level user columns.
  if (isAdmin && settings.userDetailsInTokenList) {
    columns.push(
      {
        header: <Trans>UserId</Trans>,
        key: "user_id",
        render: (token) => token.user_id
      },
      {
        header: <Trans>Resolver</Trans>,
        key: "resolver",
        render: (token) =>
          token.resolver ? (
            <Anchor href={hashHref("/config/resolvers/list")} size="sm">
              {token.resolver}
            </Anchor>
          ) : null
      }
    );
  }

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="list" />}>
      <PageHeader
        subtitle={tokenPage ? <Trans>total tokens: {tokenCount}</Trans> : null}
        title={<Trans>Tokens</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={tokensQuery.error} />
      <ErrorAlert error={toggleActiveMutation.error} />
      <ErrorAlert error={resetMutation.error} />

      <Card flush>
        {tokensQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading tokens</Trans>} />
        ) : null}

        <Pagination
          currentPage={page}
          maxSize={5}
          onPageChange={setPage}
          pageSize={settings.tokenPageSize}
          totalCount={tokenCount}
        />

        <DataTable
          columns={columns}
          data={tokenPage?.tokens ?? []}
          emptyMessage={<Trans>No tokens found.</Trans>}
          getRowKey={(token) => token.serial}
          id="tabletokenlist"
          isLoading={tokenPage === undefined}
          minWidth={isAdmin ? 1000 : 720}
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

/** Builds the filter parameters; empty filters are left out of the request. */
function toTokenParams(filters: TokenFilters): Pick<TokenListParams, TokenFilterName> {
  const requestParams: Pick<TokenListParams, TokenFilterName> = {};

  for (const [name, value] of Object.entries(filters) as [TokenFilterName, string][]) {
    if (value) {
      requestParams[name] = toContainsWildcard(value);
    }
  }

  return requestParams;
}
