import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms, getResolvers } from "@/api/config";
import { getPolicyAdminRealms, getPolicyNodes, policyQueryKeys } from "@/api/policies";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";

export interface PolicyEditorLookups {
  adminRealms: readonly string[];
  error: Error | null;
  nodes: readonly string[];
  realms: readonly string[];
  resolvers: readonly string[];
}

/** The realms, resolvers, admin realms (admin scope only) and nodes a policy can match. */
export function usePolicyEditorLookups(scope: string): PolicyEditorLookups {
  const apiClient = useApiClient();
  const { rights } = useAuth();
  const realms = useQuery({
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const resolvers = useQuery({
    enabled: hasRight(rights, "resolverread"),
    queryFn: ({ signal }) => getResolvers(apiClient, undefined, signal),
    queryKey: configQueryKeys.resolvers()
  });
  const adminRealms = useQuery({
    enabled: scope === "admin",
    queryFn: ({ signal }) => getPolicyAdminRealms(apiClient, signal),
    queryKey: policyQueryKeys.adminRealms
  });
  const nodes = useQuery({
    queryFn: ({ signal }) => getPolicyNodes(apiClient, signal),
    queryKey: policyQueryKeys.nodes
  });

  return {
    adminRealms: adminRealms.data ?? [],
    error: realms.error ?? resolvers.error ?? adminRealms.error ?? nodes.error,
    nodes: nodes.data ?? [],
    realms: Object.keys(realms.data ?? {}),
    resolvers: Object.keys(resolvers.data ?? {})
  };
}
