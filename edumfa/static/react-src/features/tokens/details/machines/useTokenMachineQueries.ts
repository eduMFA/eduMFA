import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  getApplicationDefinitions,
  getMachineTokens,
  machineQueryKeys
} from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";

/** The machines a token is attached to and the application definitions. */
export function useTokenMachineQueries(serial: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const tokenParams = { serial };
  const machinesQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachineTokens(apiClient, tokenParams, signal),
    queryKey: machineQueryKeys.tokens(tokenParams)
  });
  const applicationsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getApplicationDefinitions(apiClient, signal),
    queryKey: machineQueryKeys.applicationDefinitions
  });

  const invalidateMachines = () =>
    queryClient.invalidateQueries({ queryKey: machineQueryKeys.tokens(tokenParams) });

  return { applicationsQuery, invalidateMachines, machinesQuery };
}
