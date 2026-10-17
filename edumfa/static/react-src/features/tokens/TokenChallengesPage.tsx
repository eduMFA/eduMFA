import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { TokenSidebar } from "./TokenSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  getTokenChallenges,
  tokenQueryKeys,
  type TokenChallenge,
  type TokenChallengeListParams
} from "@/api/tokens";
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
import { formatLegacyDate } from "@/lib/dates";
import { hashHref } from "@/lib/hashbang";
import { toContainsWildcard } from "@/lib/strings";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Fixed in the legacy template (`items-per-page="15"`), not policy driven. */
const CHALLENGE_PAGE_SIZE = 15;

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

/** The backend default (`sortby=timestamp`), made explicit so the header shows it. */
const defaultSort: DataTableSort = { by: "timestamp", direction: "asc" };

/**
 * Port of `token.challenges.html`: the open challenge-response transactions,
 * paginated and sorted on the server. The serial filter is sent as the path
 * segment of `GET /token/challenges/<serial>` like the legacy controller did.
 */
export function TokenChallengesPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, settings } = useAuth();
  const serialFilter = useDebouncedState("", FILTER_DEBOUNCE_MS, {
    liveApply: !settings.searchOnEnter
  });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort>(defaultSort);

  const serialPattern = serialFilter.applied
    ? toContainsWildcard(serialFilter.applied)
    : null;
  const params = useMemo<TokenChallengeListParams>(
    () => ({
      page,
      pagesize: CHALLENGE_PAGE_SIZE,
      sortby: sort.by,
      sortdir: sort.direction
    }),
    [page, sort]
  );

  const challengesQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      getTokenChallenges(apiClient, serialPattern, params, signal),
    queryKey: tokenQueryKeys.challenges(serialPattern, params)
  });

  const challengePage = challengesQuery.data;
  const challengeCount = challengePage?.count ?? 0;

  const columns: DataTableColumn<TokenChallenge>[] = [
    {
      header: <Trans>timestamp</Trans>,
      key: "timestamp",
      nowrap: true,
      render: (challenge) => formatLegacyDate(challenge.timestamp),
      sortKey: "timestamp"
    },
    {
      filter: (
        <ColumnFilter
          label={t`serial`}
          onChange={(value) => {
            setPage(1);
            serialFilter.setDraft(value);
          }}
          onSubmit={() => {
            serialFilter.apply();
          }}
          value={serialFilter.draft}
        />
      ),
      header: <Trans>serial</Trans>,
      key: "serial",
      render: (challenge) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(challenge.serial)}`)}
          size="sm"
        >
          {challenge.serial}
        </Anchor>
      ),
      sortKey: "serial"
    },
    {
      header: <Trans>Transaction ID</Trans>,
      key: "transaction_id",
      render: (challenge) => challenge.transaction_id,
      sortKey: "transaction_id"
    },
    {
      header: <Trans>Expiration</Trans>,
      key: "expiration",
      nowrap: true,
      render: (challenge) => formatLegacyDate(challenge.expiration),
      sortKey: "expiration"
    },
    {
      align: "right",
      header: <Trans>Received</Trans>,
      key: "received_count",
      render: (challenge) => challenge.received_count,
      sortKey: "received_count"
    }
  ];

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="challenges" />}>
      <PageHeader
        subtitle={
          challengePage ? <Trans>Total Challenges: {challengeCount}</Trans> : null
        }
        title={<Trans>Challenges</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={challengesQuery.error} />

      <Card flush>
        {challengesQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading challenges</Trans>} />
        ) : null}

        <Pagination
          currentPage={page}
          maxSize={5}
          onPageChange={setPage}
          pageSize={CHALLENGE_PAGE_SIZE}
          totalCount={challengeCount}
        />

        <DataTable
          columns={columns}
          data={challengePage?.challenges ?? []}
          emptyMessage={<Trans>No open challenges.</Trans>}
          getRowKey={(challenge) => String(challenge.id)}
          id="tabletokenchallenges"
          isLoading={challengePage === undefined}
          minWidth={820}
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
