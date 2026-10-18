import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms, getResolvers } from "@/api/config";
import {
  getPolicy,
  getPolicyConditionDefinitions,
  getPolicyDefinitions,
  getPolicyNodes,
  policyQueryKeys
} from "@/api/policies";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { prefetchQuery } from "@/lib/prefetch";

/** The policy to edit plus the action and condition definitions the editor needs. */
export function usePolicyEditPageQueries(policyname: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const canOpen = hasRight(rights, policyname ? "policyread" : "policywrite");
  const enabled = isAuthenticated && canOpen;
  const policyQuery = useQuery({
    enabled: enabled && !!policyname,
    queryFn: ({ signal }) => getPolicy(apiClient, policyname, signal),
    queryKey: policyQueryKeys.detail(policyname)
  });
  const definitionsQuery = useQuery({
    enabled,
    queryFn: ({ signal }) => getPolicyDefinitions(apiClient, signal),
    queryKey: policyQueryKeys.definitions
  });
  const conditionsQuery = useQuery({
    enabled,
    queryFn: ({ signal }) => getPolicyConditionDefinitions(apiClient, signal),
    queryKey: policyQueryKeys.conditions
  });
  // The editor mounts after the definitions arrive; its own lookups do not
  // depend on them, so they start now and are in the cache by then.
  const canReadResolvers = hasRight(rights, "resolverread");
  useEffect(() => {
    if (!enabled) {
      return;
    }

    prefetchQuery(queryClient, configQueryKeys.realms, ({ signal }) =>
      getRealms(apiClient, signal)
    );
    prefetchQuery(queryClient, policyQueryKeys.nodes, ({ signal }) =>
      getPolicyNodes(apiClient, signal)
    );

    if (canReadResolvers) {
      prefetchQuery(queryClient, configQueryKeys.resolvers(), ({ signal }) =>
        getResolvers(apiClient, undefined, signal)
      );
    }
  }, [apiClient, canReadResolvers, enabled, queryClient]);

  return { canOpen, conditionsQuery, definitionsQuery, isAuthenticated, policyQuery };
}
