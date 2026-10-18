import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { getTokengroups } from "@/api/config";
import { deleteTokengroup, tokengroupQueryKeys } from "@/api/tokengroups";
import { useAuth } from "@/auth/AuthProvider";
import { popFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/** The token group list and its delete action; shows the notice the edit page left. */
export function useTokengroupList() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // "Tokengroup saved." handed over by the edit page.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const tokengroupsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getTokengroups(apiClient, signal),
    queryKey: tokengroupQueryKeys.all
  });

  const deleteMutation = useMutation({
    mutationFn: (groupname: string) => deleteTokengroup(apiClient, groupname),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokengroupQueryKeys.all });
    }
  });

  return { deleteMutation, tokengroupsQuery };
}
