import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  configQueryKeys,
  getRealms,
  getSystemConfig,
  getTokengroups
} from "@/api/config";
import {
  getApplicationDefinitions,
  getMachineTokens,
  machineQueryKeys
} from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { prefetchQuery } from "@/lib/prefetch";

/**
 * The cards only mount once the token is here, but their lookups do not
 * depend on it. Starting them now saves the round trip the cards would
 * otherwise add; their own queries then find the data in flight.
 */
export function usePrefetchTokenLookups(serial: string): void {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canListGroups = isAdmin && hasRight(rights, "tokengroup_list");
  const canManageMachines = isAdmin && hasRight(rights, "manage_machine_tokens");

  useEffect(() => {
    if (!isAuthenticated || serial.length === 0) {
      return;
    }

    prefetchQuery(queryClient, configQueryKeys.system, ({ signal }) =>
      getSystemConfig(apiClient, signal)
    );

    if (isAdmin) {
      prefetchQuery(queryClient, configQueryKeys.realms, ({ signal }) =>
        getRealms(apiClient, signal)
      );
    }

    if (canListGroups) {
      prefetchQuery(queryClient, configQueryKeys.tokengroups, ({ signal }) =>
        getTokengroups(apiClient, signal)
      );
    }

    if (canManageMachines) {
      prefetchQuery(queryClient, machineQueryKeys.tokens({ serial }), ({ signal }) =>
        getMachineTokens(apiClient, { serial }, signal)
      );
      prefetchQuery(
        queryClient,
        machineQueryKeys.applicationDefinitions,
        ({ signal }) => getApplicationDefinitions(apiClient, signal)
      );
    }
  }, [
    apiClient,
    canListGroups,
    canManageMachines,
    isAdmin,
    isAuthenticated,
    queryClient,
    serial
  ]);
}
