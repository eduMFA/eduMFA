import * as z from "zod/mini";

import type { ApiClient } from "./client";
import { configQueryKeys } from "./config";

export type PolicyCondition = [
  section: string,
  key: string,
  comparator: string,
  value: string,
  active: boolean
];
export type PolicyActions = Record<string, boolean | number | string>;

export interface Policy {
  name: string;
  scope: string;
  action: PolicyActions;
  active: boolean;
  priority: number;
  realm: string[];
  resolver: string[];
  user: string[];
  adminrealm: string[];
  adminuser: string[];
  edumfanode: string[];
  client: string[];
  time: string;
  check_all_resolvers: boolean;
  conditions: PolicyCondition[];
}

export type PolicyWriteRequest = Omit<Policy, "name">;

export interface PolicyActionDefinition {
  type: "bool" | "str" | "int" | "text";
  desc?: string;
  group?: string | null;
  multiple?: boolean;
  value?: (string | number)[];
}

export type PolicyDefinitions = Record<string, Record<string, PolicyActionDefinition>>;
export interface PolicyConditionDefinitions {
  sections: Record<string, { description: string }>;
  comparators: Record<string, { description: string }>;
}

export const policyQueryKeys = {
  list: configQueryKeys.policies,
  details: ["config", "policy"] as const,
  detail: (name: string) => ["config", "policy", name] as const,
  definitions: ["policy", "definitions"] as const,
  conditions: ["policy", "conditions"] as const,
  nodes: ["policy", "nodes"] as const,
  adminRealms: ["policy", "admin-realms"] as const,
  templates: ["policy", "templates"] as const
};

export function listPolicies(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<Policy[]> {
  return apiClient.get<Policy[]>("/policy/", { signal });
}

export function getPolicy(
  apiClient: ApiClient,
  name: string,
  signal?: AbortSignal
): Promise<Policy[]> {
  return apiClient.get<Policy[]>(`/policy/${encodeURIComponent(name)}`, { signal });
}

export function savePolicy(
  apiClient: ApiClient,
  name: string,
  request: PolicyWriteRequest
): Promise<Record<string, number>> {
  // set_policy_api uses `active or True`. A JSON false would reactivate the
  // policy; the nonempty string is parsed correctly by set_policy's is_true.
  return apiClient.post<Record<string, number>>(`/policy/${encodeURIComponent(name)}`, {
    ...request,
    active: request.active ? "true" : "false"
  });
}

export function setPolicyActive(
  apiClient: ApiClient,
  name: string,
  active: boolean
): Promise<number> {
  return apiClient.post<number>(
    `/policy/${active ? "enable" : "disable"}/${encodeURIComponent(name)}`,
    {}
  );
}

export function deletePolicy(apiClient: ApiClient, name: string): Promise<number> {
  return apiClient.delete<number>(`/policy/${encodeURIComponent(name)}`);
}

export function getPolicyDefinitions(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<PolicyDefinitions> {
  return apiClient.get<PolicyDefinitions>("/policy/defs", { signal });
}

export function getPolicyConditionDefinitions(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<PolicyConditionDefinitions> {
  return apiClient.get<PolicyConditionDefinitions>("/policy/defs/conditions", {
    signal
  });
}

export function getPolicyNodes(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>("/policy/defs/edumfanodes", { signal });
}

export function getPolicyAdminRealms(
  apiClient: ApiClient,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient.get<string[]>("/realm/superuser", { signal });
}

const optionalStringList = z.optional(z.array(z.string()));
const templateSchema = z.object({
  name: z.string().check(z.minLength(1)),
  scope: z.string().check(z.minLength(1)),
  action: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  active: z.optional(z.boolean()),
  priority: z.optional(z.int().check(z.positive())),
  realm: optionalStringList,
  resolver: optionalStringList,
  adminrealm: optionalStringList,
  edumfanode: optionalStringList,
  user: optionalStringList,
  adminuser: optionalStringList,
  client: optionalStringList,
  time: z.optional(z.string()),
  check_all_resolvers: z.optional(z.boolean()),
  conditions: z.optional(
    z.array(z.tuple([z.string(), z.string(), z.string(), z.string(), z.boolean()]))
  )
});
const templateIndexSchema = z.record(z.string(), z.string());
export type PolicyTemplate = z.infer<typeof templateSchema>;
const templateBaseUrl =
  "https://raw.githubusercontent.com/eduMFA/policy-templates/main/templates/";

/** Templates are public resources; never send the eduMFA Authorization header. */
async function fetchTemplateJson(
  filename: string,
  signal?: AbortSignal
): Promise<unknown> {
  const response = await fetch(`${templateBaseUrl}${filename}`, {
    credentials: "omit",
    ...(signal ? { signal } : {})
  });
  if (!response.ok)
    throw new Error(`Unable to load policy templates (${String(response.status)}).`);
  return response.json() as Promise<unknown>;
}

export async function getPolicyTemplates(
  signal?: AbortSignal
): Promise<Record<string, string>> {
  return z.parse(templateIndexSchema, await fetchTemplateJson("index.json", signal));
}

export async function getPolicyTemplate(name: string): Promise<PolicyTemplate> {
  return z.parse(
    templateSchema,
    await fetchTemplateJson(`${encodeURIComponent(name)}.json`)
  );
}
