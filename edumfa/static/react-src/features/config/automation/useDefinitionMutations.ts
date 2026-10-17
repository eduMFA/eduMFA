import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiClient } from "@/api/client";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  eventQueryKeys,
  setEvent,
  enableEvent,
  disableEvent,
  deleteEvent
} from "@/api/events";
import {
  periodicTaskQueryKeys,
  setPeriodicTask,
  enablePeriodicTask,
  disablePeriodicTask,
  deletePeriodicTask
} from "@/api/periodicTasks";

/** API calls and query key a definition type (event handler, periodic task) plugs in. */
export interface DefinitionApi<T> {
  queryKey: readonly string[];
  save: (client: ApiClient, request: T) => Promise<number>;
  enable: (client: ApiClient, id: number) => Promise<number>;
  disable: (client: ApiClient, id: number) => Promise<number>;
  remove: (client: ApiClient, id: number) => Promise<number>;
}

export const eventDefinitionApi = {
  queryKey: eventQueryKeys.all,
  save: setEvent,
  enable: enableEvent,
  disable: disableEvent,
  remove: deleteEvent
};

export const taskDefinitionApi = {
  queryKey: periodicTaskQueryKeys.all,
  save: setPeriodicTask,
  enable: enablePeriodicTask,
  disable: disablePeriodicTask,
  remove: deletePeriodicTask
};

/** Save/toggle/delete mutations that refresh the list queries on success. */
export function useDefinitionMutations<T>(api: DefinitionApi<T>) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: api.queryKey });
  const save = useMutation({
    mutationFn: (request: T) => api.save(client, request),
    onSuccess: refresh
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      (active ? api.enable : api.disable)(client, id),
    onSuccess: refresh
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.remove(client, id),
    onSuccess: refresh
  });

  return {
    save,
    toggle,
    remove,
    busy: save.isPending || toggle.isPending || remove.isPending,
    error: save.error ?? toggle.error ?? remove.error
  };
}
