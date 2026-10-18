import { Trans } from "@lingui/react/macro";
import { useEffect } from "react";

import { useTokenList } from "./list/useTokenList";
import { useTokenListColumns } from "./list/useTokenListColumns";
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
import { popFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/**
 * Port of `token.list.html`: the paginated, sortable token table with the
 * inline enable/disable and fail counter reset actions. Paging, sorting and
 * filtering stay on the server like in the legacy controller.
 */
export function TokenListPage() {
  const { isAuthenticated, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const {
    applyFilters,
    draftFilters,
    page,
    resetMutation,
    setDraftFilter,
    setPage,
    setSort,
    sort,
    toggleActiveMutation,
    tokensQuery
  } = useTokenList();
  const columns = useTokenListColumns({
    draftFilters,
    onFilterChange: setDraftFilter,
    onFilterSubmit: () => {
      applyFilters();
    },
    onReset: resetMutation.mutate,
    onToggleActive: toggleActiveMutation.mutate
  });

  // Notices handed over by the assign page, e.g. "Token assigned successfully."
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const tokenPage = tokensQuery.data;
  const tokenCount = tokenPage?.count ?? 0;

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
