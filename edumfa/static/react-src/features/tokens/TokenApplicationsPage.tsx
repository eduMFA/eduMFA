import { Trans } from "@lingui/react/macro";
import { useNavigate, useParams } from "react-router-dom";

import { ApplicationPageHeader } from "./applications/ApplicationPageHeader";
import { ApplicationSelectCard } from "./applications/ApplicationSelectCard";
import { type ApplicationName } from "./applications/types";
import { useMachineTokenColumns } from "./applications/useMachineTokenColumns";
import { PAGE_SIZE, useMachineTokenList } from "./applications/useMachineTokenList";
import { TokenSidebar } from "./TokenSidebar";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";

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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    applyFilters,
    assignments,
    draftFilters,
    page,
    setDraftFilter,
    setPage,
    setSort,
    sort,
    tokensQuery,
    visibleAssignments
  } = useMachineTokenList(application);
  const columns = useMachineTokenColumns({
    application,
    draftFilters,
    onFilterChange: setDraftFilter,
    onFilterSubmit: () => {
      applyFilters();
    }
  });

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="applications" />}>
      <ApplicationPageHeader application={application} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={tokensQuery.error} />

      <ApplicationSelectCard
        application={application}
        onChange={(nextApplication) => {
          setPage(1);
          applyFilters({});
          void navigate(`/token/applications/${nextApplication}`);
        }}
      />

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
