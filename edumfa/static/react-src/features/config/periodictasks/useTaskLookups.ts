import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  periodicTaskQueryKeys,
  getPeriodicTaskModules,
  getTaskModuleOptions,
  getPeriodicTaskNodes
} from "@/api/periodicTasks";

/** Lookup data of the task form; the option specs depend on the chosen task module. */
export function useTaskLookups(taskmodule: string) {
  const client = useApiClient();
  const nodes = useQuery({
    queryKey: periodicTaskQueryKeys.nodes,
    queryFn: ({ signal }) => getPeriodicTaskNodes(client, signal)
  });
  const modules = useQuery({
    queryKey: periodicTaskQueryKeys.taskModules,
    queryFn: ({ signal }) => getPeriodicTaskModules(client, signal)
  });
  const specs = useQuery({
    queryKey: periodicTaskQueryKeys.options(taskmodule),
    queryFn: ({ signal }) => getTaskModuleOptions(client, taskmodule, signal),
    enabled: Boolean(taskmodule)
  });

  return {
    error: nodes.error ?? modules.error ?? specs.error,
    modules,
    nodes,
    // Saving is blocked until all lookup data has loaded, so no option is validated against missing specs.
    ready: nodes.isSuccess && modules.isSuccess && specs.isSuccess,
    specs
  };
}
