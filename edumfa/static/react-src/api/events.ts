import type { ApiClient } from "./client";

/**
 * Port of the event handler calls of the AngularJS `ConfigFactory`
 * (`components/config/factories/config.js`) plus the two lookups the
 * `eventDetailController` fetched through `getEvent("available")` and
 * `getEvent("handlermodules")`.
 */

/** One event handler definition of `GET /event/`. */
export interface EventHandlerDefinition {
  action: string;
  active: boolean;
  /** Legacy single-condition column; empty for definitions made in the UI. */
  condition?: string;
  conditions: Record<string, string>;
  event: string[];
  handlermodule: string;
  id: number;
  name: string;
  /** Option values are stored as strings; booleans arrive as "True"/"False". */
  options: Record<string, string>;
  ordering: number;
  position: string;
}

/** One option of a handler action (`GET /event/actions/<module>`). */
export interface EventOptionSpec {
  description?: string;
  required?: boolean;
  /** "str", "int", "bool" or "text". */
  type?: string;
  /** Allowed values, rendered as a select; `int` options list numbers. */
  value?: (number | string)[];
  /** The option is only shown while the option named here equals `visibleValue`. */
  visibleIf?: string;
  visibleValue?: string;
}

/** The actions of a handler module with their options. */
export type EventHandlerActions = Record<string, Record<string, EventOptionSpec>>;

/** One condition of a handler module (`GET /event/conditions/<module>`). */
export interface EventConditionSpec {
  desc?: string;
  /** Accordion group in the editor; conditions without one are "miscellaneous". */
  group?: string | null;
  required?: boolean;
  /** "str", "multi", "text" or "regexp". */
  type?: string;
  /** Allowed values: strings for `str`, `{ name }` entries for `multi`. */
  value?: (string | { name: string })[];
}

export type EventHandlerConditions = Record<string, EventConditionSpec>;

/**
 * Body of `POST /event`. The handler options travel as `option.<name>`
 * keys, which the backend collects by prefix (`api/event.py`).
 */
export interface EventWriteParams {
  action: string;
  /** Left out for new definitions; the backend then defaults to active. */
  active?: boolean;
  conditions: Record<string, string>;
  /** Comma separated event names. */
  event: string;
  handlermodule: string;
  /** Set to update an existing definition. */
  id?: number;
  name: string;
  ordering: number;
  position: string;
  [option: `option.${string}`]: boolean | number | string;
}

export const eventQueryKeys = {
  /** Prefix shared with `configQueryKeys.events`, so the dashboard refreshes too. */
  all: ["config", "events"] as const,
  availableEvents: ["config", "events", "available"] as const,
  handlerModules: ["config", "events", "handlermodules"] as const,
  list: ["config", "events", "list"] as const,
  actions: (handlerModule: string) =>
    ["config", "events", "actions", handlerModule] as const,
  conditions: (handlerModule: string) =>
    ["config", "events", "conditions", handlerModule] as const,
  detail: (eventId: string) => ["config", "events", "detail", eventId] as const,
  positions: (handlerModule: string) =>
    ["config", "events", "positions", handlerModule] as const
};

export function getEvents(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<EventHandlerDefinition[]> {
  return apiClient.get<EventHandlerDefinition[]>("/event/", { signal });
}

/** `GET /event/<id>` answers a list holding the one matching definition. */
export function getEvent(
  apiClient: ApiClient,
  eventId: number | string,
  signal?: AbortSignal
): Promise<EventHandlerDefinition[]> {
  return apiClient.get<EventHandlerDefinition[]>(
    `/event/${encodeURIComponent(String(eventId))}`,
    { signal }
  );
}

/** The event names a handler can be bound to. */
export function getAvailableEvents(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>("/event/available", { signal });
}

export function getEventHandlerModules(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>("/event/handlermodules", { signal });
}

export function getHandlerActions(
  apiClient: ApiClient,
  handlerModule: string,
  signal?: AbortSignal
): Promise<EventHandlerActions> {
  return apiClient.get<EventHandlerActions>(
    `/event/actions/${encodeURIComponent(handlerModule)}`,
    { signal }
  );
}

export function getHandlerConditions(
  apiClient: ApiClient,
  handlerModule: string,
  signal?: AbortSignal
): Promise<EventHandlerConditions> {
  return apiClient.get<EventHandlerConditions>(
    `/event/conditions/${encodeURIComponent(handlerModule)}`,
    { signal }
  );
}

export function getHandlerPositions(
  apiClient: ApiClient,
  handlerModule: string,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>(
    `/event/positions/${encodeURIComponent(handlerModule)}`,
    { signal }
  );
}

/** Creates or (with `id`) replaces a definition; answers the definition id. */
export function setEvent(
  apiClient: ApiClient,
  params: EventWriteParams
): Promise<number> {
  return apiClient.post<number>("/event", params);
}

export function deleteEvent(apiClient: ApiClient, eventId: number): Promise<number> {
  return apiClient.delete<number>(`/event/${String(eventId)}`);
}

export function enableEvent(apiClient: ApiClient, eventId: number): Promise<number> {
  return apiClient.post<number>(`/event/enable/${String(eventId)}`, {});
}

export function disableEvent(apiClient: ApiClient, eventId: number): Promise<number> {
  return apiClient.post<number>(`/event/disable/${String(eventId)}`, {});
}
