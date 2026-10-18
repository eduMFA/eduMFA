import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  getMachines,
  machineQueryKeys,
  type MachineDetail,
  type MachineListParams
} from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";

/** Like the legacy controller, machines are paginated client-side. */
export const MACHINE_PAGE_SIZE = 15;

export interface MachineFilters {
  hostname: string;
  id: string;
  ip: string;
  resolver: string;
}

export interface MachineList {
  allMachines: MachineDetail[];
  filters: MachineFilters;
  machinesQuery: UseQueryResult<MachineDetail[]>;
  page: number;
  setFilter: (name: keyof MachineFilters, value: string) => void;
  setPage: Dispatch<SetStateAction<number>>;
  visibleMachines: MachineDetail[];
}

/** The column filters, the machine query and the client-side paging. */
export function useMachineList(): MachineList {
  const apiClient = useApiClient();
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

  const params = useMemo<MachineListParams>(
    () => toMachineListParams(filters),
    [filters]
  );

  const machinesQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachines(apiClient, params, signal),
    queryKey: machineQueryKeys.list(params)
  });

  const allMachines = machinesQuery.data ?? [];
  const pageStart = (page - 1) * MACHINE_PAGE_SIZE;

  return {
    allMachines,
    filters,
    machinesQuery,
    page,
    setFilter: (name, value) => {
      setPage(1);
      setFilters((previousFilters) => ({ ...previousFilters, [name]: value }));
    },
    setPage,
    visibleMachines: allMachines.slice(pageStart, pageStart + MACHINE_PAGE_SIZE)
  };
}

/** Only non-empty filters are sent; the backend matches them as typed. */
function toMachineListParams(filters: MachineFilters): MachineListParams {
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
}
