import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { MachineSidebar } from "./MachineSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import {
  formatMachineHostname,
  getMachines,
  machineQueryKeys,
  type MachineDetail,
  type MachineListParams
} from "../../api/machines";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "../../components/feedback/LoginRequiredAlert";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { ColumnFilter } from "../../components/tables/ColumnFilter";
import { DataTable, type DataTableColumn } from "../../components/tables/DataTable";
import { Pagination } from "../../components/tables/Pagination";
import { hashHref } from "../../lib/hashbang";

/** Like the legacy controller, machines are paginated client-side. */
const MACHINE_PAGE_SIZE = 15;

interface MachineFilters {
  hostname: string;
  id: string;
  ip: string;
  resolver: string;
}

export function MachineListPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  // The machine details view links back here with ?resolver=<name>.
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<MachineFilters>(() => ({
    hostname: "",
    id: "",
    ip: "",
    resolver: searchParams.get("resolver") ?? ""
  }));
  const [page, setPage] = useState(1);

  const params = useMemo<MachineListParams>(() => {
    const listParams: MachineListParams = {};

    if (filters.hostname) {
      listParams.hostname = filters.hostname;
    }

    if (filters.ip) {
      listParams.ip = filters.ip;
    }

    if (filters.id) {
      listParams.id = filters.id;
    }

    if (filters.resolver) {
      listParams.resolver = filters.resolver;
    }

    return listParams;
  }, [filters]);

  const machinesQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachines(apiClient, params, signal),
    queryKey: machineQueryKeys.list(params)
  });

  const allMachines = machinesQuery.data ?? [];
  const pageStart = (page - 1) * MACHINE_PAGE_SIZE;
  const visibleMachines = allMachines.slice(pageStart, pageStart + MACHINE_PAGE_SIZE);

  const setFilter = (name: keyof MachineFilters, value: string) => {
    setPage(1);
    setFilters((previousFilters) => ({ ...previousFilters, [name]: value }));
  };

  const filterFor = (name: keyof MachineFilters, label: string) => (
    <ColumnFilter
      label={label}
      onChange={(value) => {
        setFilter(name, value);
      }}
      value={filters[name]}
    />
  );

  const columns: DataTableColumn<MachineDetail>[] = [
    {
      filter: filterFor("hostname", t`hostname`),
      header: <Trans>hostname</Trans>,
      key: "hostname",
      render: (machine) => (
        <Anchor
          href={hashHref(
            `/machine/details/${encodeURIComponent(machine.id)}/${encodeURIComponent(machine.resolver_name)}`
          )}
          size="sm"
        >
          {formatMachineHostname(machine.hostname)}
        </Anchor>
      )
    },
    {
      filter: filterFor("ip", t`IP Address`),
      header: <Trans>IP Address</Trans>,
      key: "ip",
      render: (machine) => machine.ip
    },
    {
      filter: filterFor("id", t`Id`),
      header: <Trans>Id</Trans>,
      key: "id",
      render: (machine) => machine.id
    },
    {
      filter: filterFor("resolver", t`Machine Resolver`),
      header: <Trans>Machine Resolver</Trans>,
      key: "resolver_name",
      render: (machine) => machine.resolver_name
    }
  ];

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
          currentPage={page}
          maxSize={5}
          onPageChange={setPage}
          pageSize={MACHINE_PAGE_SIZE}
          totalCount={allMachines.length}
        />

        <DataTable
          columns={columns}
          data={visibleMachines}
          emptyMessage={<Trans>No machines found.</Trans>}
          getRowKey={(machine) => `${machine.resolver_name}-${machine.id}`}
          id="tablemachinelist"
          isLoading={machinesQuery.data === undefined}
        />
      </Card>
    </SidebarLayout>
  );
}
