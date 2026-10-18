import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import type { HostsFormValues } from "./hostsMachineResolverValues";
import { useApiClient } from "@/api/ApiClientProvider";
import { machineResolverQueryKeys, saveMachineResolver } from "@/api/machineResolvers";

/**
 * `POST /machineresolver/<name>` of a hosts resolver, followed by what the
 * legacy controller did: refresh the list and go back to it. Stored keys
 * the form does not know are sent back unchanged.
 */
export function useSaveHostsMachineResolver(storedData: Record<string, unknown>) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (values: HostsFormValues) =>
      saveMachineResolver(apiClient, values.resolvername, {
        ...storedData,
        filename: values.filename,
        type: "hosts"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: machineResolverQueryKeys.all });
      void navigate("/config/machineresolvers/list");
    }
  });
}
