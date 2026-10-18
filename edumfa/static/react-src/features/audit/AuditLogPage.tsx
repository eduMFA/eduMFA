import { Trans, useLingui } from "@lingui/react/macro";
import { Box } from "@mantine/core";

import { ActiveFilterChips } from "./ActiveFilterChips";
import { AuditDownloadButton } from "./AuditDownloadButton";
import { createAuditColumns } from "./createAuditColumns";
import { useAuditLog } from "./useAuditLog";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";

export function AuditLogPage() {
  const { t } = useLingui();

  const { isAuthenticated, rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const log = useAuditLog();
  const { auditQuery, downloadMutation } = log;
  const auditPage = auditQuery.data;
  const canDownload = isAdmin && rights.includes("auditlog_download");
  const entryCount = auditPage?.count ?? 0;
  const columns = createAuditColumns(auditPage?.auditcolumns ?? [], isAdmin, log);

  return (
    <Box className="react-migration-shell">
      <PageHeader
        actions={
          canDownload ? (
            <AuditDownloadButton
              isPending={downloadMutation.isPending}
              onClick={() => {
                downloadMutation.mutate();
              }}
            />
          ) : null
        }
        subtitle={auditPage ? <Trans>{entryCount} entries found.</Trans> : null}
        title={t`Audit log`}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={auditQuery.error} />
      <ErrorAlert error={downloadMutation.error} />

      <Card flush>
        <ActiveFilterChips
          appliedFilters={log.appliedFilters}
          onReplace={log.replaceFilters}
        />

        {auditQuery.isLoading ? (
          <LoadingIndicator label={t`Loading audit log`} />
        ) : null}

        <Pagination
          currentPage={log.page}
          onPageChange={log.setPage}
          pageSize={log.pageSize}
          totalCount={entryCount}
        />

        {auditPage ? (
          <DataTable
            columns={columns}
            data={auditPage.auditdata}
            emptyMessage={t`No audit entries match the current filters.`}
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
