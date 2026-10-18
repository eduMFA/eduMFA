import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getResolvers } from "@/api/config";
import { deleteResolver, resolverQueryKeys } from "@/api/resolvers";
import { useAuth } from "@/auth/AuthProvider";
import { popFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/** The resolver list and its delete action; shows the notice an editor left behind. */
export function useResolverList() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Notices handed over by the editors, e.g. the LDAP restart reminder.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const resolversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getResolvers(apiClient, undefined, signal),
    queryKey: configQueryKeys.resolvers()
  });

  const deleteMutation = useMutation({
    mutationFn: (resolverName: string) => deleteResolver(apiClient, resolverName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resolverQueryKeys.lists });
    }
  });

  return {
    deleteMutation,
    resolvers: Object.values(resolversQuery.data ?? {}),
    resolversQuery
  };
}
