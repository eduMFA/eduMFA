import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { getServiceIds } from "@/api/config";
import { deleteServiceId, serviceIdQueryKeys } from "@/api/serviceIds";
import { useAuth } from "@/auth/AuthProvider";
import { popFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/** The service ID list and its delete action; shows the notice the edit page left. */
export function useServiceIdList() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // "Service ID saved." handed over by the edit page.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const serviceIdsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getServiceIds(apiClient, signal),
    queryKey: serviceIdQueryKeys.all
  });

  const deleteMutation = useMutation({
    mutationFn: (servicename: string) => deleteServiceId(apiClient, servicename),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceIdQueryKeys.all });
    }
  });

  return { deleteMutation, serviceIdsQuery };
}
