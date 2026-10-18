import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys } from "@/api/config";
import {
  buildRealmRequest,
  clearDefaultRealm,
  deleteRealm,
  setDefaultRealm,
  setRealm,
  type RealmResolverSelections
} from "@/api/realms";

export interface SaveRealmVariables {
  realmName: string;
  selections: RealmResolverSelections;
}

/**
 * The realm writes of the list page: save (create or edit), delete, set
 * and clear the default. Every one refreshes the realm list afterwards.
 */
export function useRealmMutations(onSaved: () => void) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const invalidateRealms = () =>
    queryClient.invalidateQueries({ queryKey: configQueryKeys.realms });
  const saveMutation = useMutation({
    mutationFn: ({ realmName, selections }: SaveRealmVariables) =>
      setRealm(apiClient, realmName, buildRealmRequest(selections)),
    onSuccess: async () => {
      onSaved();
      await invalidateRealms();
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (realmName: string) => deleteRealm(apiClient, realmName),
    onSuccess: invalidateRealms
  });
  const setDefaultMutation = useMutation({
    mutationFn: (realmName: string) => setDefaultRealm(apiClient, realmName),
    onSuccess: invalidateRealms
  });
  const clearDefaultMutation = useMutation({
    mutationFn: () => clearDefaultRealm(apiClient),
    onSuccess: invalidateRealms
  });

  return { clearDefaultMutation, deleteMutation, saveMutation, setDefaultMutation };
}
