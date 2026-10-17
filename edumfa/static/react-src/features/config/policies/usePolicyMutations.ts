import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  deletePolicy,
  policyQueryKeys,
  savePolicy,
  setPolicyActive,
  type PolicyWriteRequest
} from "@/api/policies";

/** Refresh both the configuration pages and the dashboard's shared policy list. */
export function usePolicyMutations() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.list }),
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.details })
    ]);
  };
  const save = useMutation({
    mutationFn: ({ name, request }: { name: string; request: PolicyWriteRequest }) =>
      savePolicy(apiClient, name, request),
    onSuccess: refresh
  });
  const toggle = useMutation({
    mutationFn: ({ name, active }: { name: string; active: boolean }) =>
      setPolicyActive(apiClient, name, active),
    onSuccess: refresh
  });
  const remove = useMutation({
    mutationFn: (name: string) => deletePolicy(apiClient, name),
    onSuccess: refresh
  });
  return {
    save,
    toggle,
    remove,
    busy: save.isPending || toggle.isPending || remove.isPending
  };
}
