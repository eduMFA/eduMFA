import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  eventQueryKeys,
  getAvailableEvents,
  getEventHandlerModules,
  getHandlerActions,
  getHandlerConditions,
  getHandlerPositions
} from "@/api/events";

/** Lookup data of the event form; actions, conditions and positions depend on the chosen module. */
export function useEventLookups(handlermodule: string) {
  const client = useApiClient();
  const events = useQuery({
    queryKey: eventQueryKeys.availableEvents,
    queryFn: ({ signal }) => getAvailableEvents(client, signal)
  });
  const modules = useQuery({
    queryKey: eventQueryKeys.handlerModules,
    queryFn: ({ signal }) => getEventHandlerModules(client, signal)
  });
  const actions = useQuery({
    queryKey: eventQueryKeys.actions(handlermodule),
    queryFn: ({ signal }) => getHandlerActions(client, handlermodule, signal),
    enabled: Boolean(handlermodule)
  });
  const conditions = useQuery({
    queryKey: eventQueryKeys.conditions(handlermodule),
    queryFn: ({ signal }) => getHandlerConditions(client, handlermodule, signal),
    enabled: Boolean(handlermodule)
  });
  const positions = useQuery({
    queryKey: eventQueryKeys.positions(handlermodule),
    queryFn: ({ signal }) => getHandlerPositions(client, handlermodule, signal),
    enabled: Boolean(handlermodule)
  });

  // Saving is blocked until all lookup data has loaded.
  const ready =
    events.isSuccess &&
    modules.isSuccess &&
    actions.isSuccess &&
    conditions.isSuccess &&
    positions.isSuccess;

  return {
    actions,
    conditions,
    error:
      events.error ??
      modules.error ??
      actions.error ??
      conditions.error ??
      positions.error,
    events,
    modules,
    /** A module is chosen and its lookups are still on their way. */
    pending:
      Boolean(handlermodule) &&
      !ready &&
      !actions.error &&
      !conditions.error &&
      !positions.error,
    positions,
    ready
  };
}
