import { Trans } from "@lingui/react/macro";

import { useTokenChallengeColumns } from "./challenges/useTokenChallengeColumns";
import {
  CHALLENGE_PAGE_SIZE,
  useTokenChallenges
} from "./challenges/useTokenChallenges";
import { TokenSidebar } from "./TokenSidebar";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";

/**
 * Port of `token.challenges.html`: the open challenge-response transactions,
 * paginated and sorted on the server. The serial filter is sent as the path
 * segment of `GET /token/challenges/<serial>` like the legacy controller did.
 */
export function TokenChallengesPage() {
  const { isAuthenticated } = useAuth();
  const {
    challengesQuery,
    page,
    serialFilter,
    setPage,
    setSerialDraft,
    setSort,
    sort
  } = useTokenChallenges();
  const columns = useTokenChallengeColumns({
    onFilterChange: setSerialDraft,
    onFilterSubmit: () => {
      serialFilter.apply();
    },
    serialDraft: serialFilter.draft
  });

  const challengePage = challengesQuery.data;
  const challengeCount = challengePage?.count ?? 0;

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
