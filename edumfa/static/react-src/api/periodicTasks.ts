import type { ApiClient } from "./client";

/**
 * Port of the periodic task calls of the AngularJS `ConfigFactory`
 * (`components/config/factories/config.js`).
 */

/** One task of `GET /periodictask/`, timestamps as ISO 8601 strings. */
export interface PeriodicTask {
  active: boolean;
  id: number;
  /** Crontab notation. */
  interval: string;
  /** Last run per node name. */
  last_runs: Record<string, string>;
  last_update: string;
  name: string;
  nodes: string[];
  /** Option values are stored as strings; booleans arrive as "True"/"False". */
  options: Record<string, string>;
  ordering: number;
  retry_if_failed: boolean;
  taskmodule: string;
}

/** One option of a task module (`GET /periodictask/options/<module>`). */
export interface TaskModuleOptionSpec {
  description?: string;
  required?: boolean;
  /** "str", "bool" or "text". */
  type?: string;
  /** Allowed values, rendered as a select. */
  value?: (number | string)[];
}

export type TaskModuleOptions = Record<string, TaskModuleOptionSpec>;

/** Body of `POST /periodictask/`, the keys the legacy controller sent. */
export interface PeriodicTaskWriteParams {
  /** Left out for new tasks; the backend then defaults to active. */
  active?: boolean;
  /** Set to update an existing task. */
  id?: number;
  interval: string;
  name: string;
  /** Comma separated node names ("node1, node2"), joined like the legacy controller did. */
  nodes: string;
  options: Record<string, boolean | number | string>;
  ordering: number;
  retry_if_failed?: boolean;
  taskmodule: string;
}

/**
 * Pseudo node offered next to the real nodes: a task bound to it only runs
 * when started by hand with `edumfa-manage periodictask ... --node select_manually`.
 */
export const SELECT_MANUALLY_NODE = "select_manually";

/** The node choices of the editor: the pseudo node first, like the legacy controller. */
export function getSelectableNodes(nodes: readonly string[]): string[] {
  return [
    SELECT_MANUALLY_NODE,
    ...nodes.filter((node) => node !== SELECT_MANUALLY_NODE)
  ];
}

export const periodicTaskQueryKeys = {
  all: ["config", "periodictasks"] as const,
  list: ["config", "periodictasks", "list"] as const,
  nodes: ["config", "periodictasks", "nodes"] as const,
  taskModules: ["config", "periodictasks", "taskmodules"] as const,
  detail: (taskId: string) => ["config", "periodictasks", "detail", taskId] as const,
  options: (taskModule: string) =>
    ["config", "periodictasks", "options", taskModule] as const
};

export function getPeriodicTasks(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<PeriodicTask[]> {
  return apiClient.get<PeriodicTask[]>("/periodictask/", { signal });
}

export function getPeriodicTask(
  apiClient: ApiClient,
  taskId: number | string,
  signal?: AbortSignal
): Promise<PeriodicTask> {
  return apiClient.get<PeriodicTask>(
    `/periodictask/${encodeURIComponent(String(taskId))}`,
    { signal }
  );
}

export function getPeriodicTaskModules(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>("/periodictask/taskmodules/", { signal });
}

export function getTaskModuleOptions(
  apiClient: ApiClient,
  taskModule: string,
  signal?: AbortSignal
): Promise<TaskModuleOptions> {
  return apiClient.get<TaskModuleOptions>(
    `/periodictask/options/${encodeURIComponent(taskModule)}`,
    { signal }
  );
}

/** The configured eduMFA nodes (`EDUMFA_NODES` plus the local node). */
export function getPeriodicTaskNodes(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>("/periodictask/nodes/", { signal });
}

/** Creates or (with `id`) replaces a task; answers the task id. */
export function setPeriodicTask(
  apiClient: ApiClient,
  params: PeriodicTaskWriteParams
): Promise<number> {
  return apiClient.post<number>("/periodictask/", params);
}

export function deletePeriodicTask(
  apiClient: ApiClient,
  taskId: number
): Promise<number> {
  return apiClient.delete<number>(`/periodictask/${String(taskId)}`);
}

export function enablePeriodicTask(
  apiClient: ApiClient,
  taskId: number
): Promise<number> {
  return apiClient.post<number>(`/periodictask/enable/${String(taskId)}`, {});
}

export function disablePeriodicTask(
  apiClient: ApiClient,
  taskId: number
): Promise<number> {
  return apiClient.post<number>(`/periodictask/disable/${String(taskId)}`, {});
}
