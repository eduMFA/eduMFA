import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type UseQueryResult
} from "@tanstack/react-query";
import { useMemo } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  getApplicationDefinitions,
  getMachines,
  getMachineTokens,
  machineQueryKeys,
  type ApplicationDefinitions,
  type MachineDetail,
  type MachineTokenAssignment,
  type MachineTokenParams
} from "@/api/machines";

export interface MachineDetails {
  /** The applications a token can be attached with. */
  applicationNames: string[];
  applications: ApplicationDefinitions;
  applicationsQuery: UseQueryResult<ApplicationDefinitions>;
  assignments: MachineTokenAssignment[];
  invalidateTokens: () => Promise<void>;
  machine: MachineDetail | null;
  machineQuery: UseQueryResult<MachineDetail | null>;
  tokensQuery: UseQueryResult<MachineTokenAssignment[]>;
}

/** Loads the machine, its token assignments and the application definitions. */
export function useMachineDetails(
  machineId: string,
  machineResolver: string,
  enabled: boolean
): MachineDetails {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const machineParams = useMemo(
    () => ({ id: machineId, resolver: machineResolver }),
    [machineId, machineResolver]
  );
  const machineQuery = useQuery({
    enabled,
    queryFn: async ({ signal }) => {
      const machines = await getMachines(apiClient, machineParams, signal);

      return machines[0] ?? null;
    },
    queryKey: machineQueryKeys.list(machineParams)
  });

  const tokenParams = useMemo<MachineTokenParams>(
    () => ({ machineid: machineId, resolver: machineResolver }),
    [machineId, machineResolver]
  );
  const tokensQuery = useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachineTokens(apiClient, tokenParams, signal),
    queryKey: machineQueryKeys.tokens(tokenParams)
  });

  const applicationsQuery = useQuery({
    enabled,
    queryFn: ({ signal }) => getApplicationDefinitions(apiClient, signal),
    queryKey: machineQueryKeys.applicationDefinitions
  });

  const applications = applicationsQuery.data ?? {};

  return {
    // "offline" tokens are attached through the token views, not here.
    applicationNames: Object.keys(applications).filter((name) => name !== "offline"),
    applications,
    applicationsQuery,
    assignments: tokensQuery.data ?? [],
    invalidateTokens: () =>
      queryClient.invalidateQueries({ queryKey: machineQueryKeys.tokens(tokenParams) }),
    machine: machineQuery.data ?? null,
    machineQuery,
    tokensQuery
  };
}
