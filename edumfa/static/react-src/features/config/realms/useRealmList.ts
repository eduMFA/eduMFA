import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms, getResolvers } from "@/api/config";
import { useAuth } from "@/auth/AuthProvider";

/** The realms and the resolvers they can be made of. */
export function useRealmList() {
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();

  const realmsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const resolversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getResolvers(apiClient, undefined, signal),
    queryKey: configQueryKeys.resolvers()
  });

  return {
    realmsQuery,
    resolvers: Object.values(resolversQuery.data ?? {}),
    resolversQuery
  };
}
