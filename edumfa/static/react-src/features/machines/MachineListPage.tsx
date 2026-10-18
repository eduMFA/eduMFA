import { Trans } from "@lingui/react/macro";

import { MachineSidebar } from "./MachineSidebar";
import { MACHINE_PAGE_SIZE, useMachineList } from "./useMachineList";
import { useMachineListColumns } from "./useMachineListColumns";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";

export function MachineListPage() {
  const { isAuthenticated } = useAuth();
  const list = useMachineList();
  const { allMachines, filters, machinesQuery } = list;
  const columns = useMachineListColumns(list);

  return (
    <SidebarLayout
      sidebar={
        <MachineSidebar
          activeItem="list"
          machineCount={machinesQuery.data ? allMachines.length : undefined}
        />
      }
    >
      <PageHeader
        subtitle={
          filters.resolver ? <Trans>Machine Resolver {filters.resolver}</Trans> : null
        }
        title={<Trans>Machines</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={machinesQuery.error} />

      <Card flush>
        {machinesQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading machines</Trans>} />
        ) : null}

        <Pagination
          currentPage={list.page}
          maxSize={5}
          onPageChange={list.setPage}
          pageSize={MACHINE_PAGE_SIZE}
          totalCount={allMachines.length}
        />

        <DataTable
          columns={columns}
          data={list.visibleMachines}
          emptyMessage={<Trans>No machines found.</Trans>}
          getRowKey={(machine) => `${machine.resolver_name}-${machine.id}`}
          id="tablemachinelist"
          isLoading={machinesQuery.data === undefined}
        />
      </Card>
    </SidebarLayout>
  );
}
