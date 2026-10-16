import { Trans, useLingui } from "@lingui/react/macro";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { MachineSidebar } from "./MachineSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import {
  formatMachineHostname,
  getMachines,
  machineQueryKeys,
  type MachineListParams
} from "../../api/machines";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { ColumnFilter } from "../../components/tables/ColumnFilter";
import { EmptyState } from "../../components/tables/EmptyState";
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

      {!isAuthenticated ? (
        <div className="alert alert-warning" role="alert">
          <Trans>
            Log in through the legacy UI before opening this migrated route.
          </Trans>
        </div>
      ) : null}

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

        <div className="table-responsive">
          <table className="table table-bordered table-striped" id="tablemachinelist">
            <thead>
              <tr>
                <th className="pifilter">
                  <Trans>hostname</Trans>
                  <ColumnFilter
                    label={t`hostname`}
                    onChange={(value) => {
                      setFilter("hostname", value);
                    }}
                    value={filters.hostname}
                  />
                </th>
                <th className="pifilter">
                  <Trans>IP Address</Trans>
                  <ColumnFilter
                    label={t`IP Address`}
                    onChange={(value) => {
                      setFilter("ip", value);
                    }}
                    value={filters.ip}
                  />
                </th>
                <th className="pifilter">
                  <Trans>Id</Trans>
                  <ColumnFilter
                    label={t`Id`}
                    onChange={(value) => {
                      setFilter("id", value);
                    }}
                    value={filters.id}
                  />
                </th>
                <th className="pifilter">
                  <Trans>Machine Resolver</Trans>
                  <ColumnFilter
                    label={t`Machine Resolver`}
                    onChange={(value) => {
                      setFilter("resolver", value);
                    }}
                    value={filters.resolver}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleMachines.length === 0 && !machinesQuery.isLoading ? (
                <EmptyState colSpan={4} message={<Trans>No machines found.</Trans>} />
              ) : (
                visibleMachines.map((machine) => (
                  <tr key={`${machine.resolver_name}-${machine.id}`}>
                    <td>
                      <a
                        href={hashHref(
                          `/machine/details/${encodeURIComponent(machine.id)}/${encodeURIComponent(machine.resolver_name)}`
                        )}
                      >
                        {formatMachineHostname(machine.hostname)}
                      </a>
                    </td>
                    <td>{machine.ip}</td>
                    <td>{machine.id}</td>
                    <td>{machine.resolver_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </SidebarLayout>
  );
}
