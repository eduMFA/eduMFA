import type {
  Policy,
  PolicyActions,
  PolicyCondition,
  PolicyDefinitions,
  PolicyTemplate,
  PolicyWriteRequest
} from "@/api/policies";
import type { TypedOptionValue } from "@/components/forms/TypedOptionInput";

export interface PolicyFormValues {
  name: string;
  scope: string;
  active: boolean;
  priority: number | string;
  actions: Record<string, TypedOptionValue>;
  realm: string[];
  resolver: string[];
  adminrealm: string[];
  edumfanode: string[];
  user: string;
  adminuser: string;
  client: string;
  time: string;
  checkAllResolvers: boolean;
  conditions: PolicyCondition[];
}

export function readPolicyForm(policy?: Policy | PolicyTemplate): PolicyFormValues {
  return {
    name: policy?.name ?? "",
    scope: policy?.scope ?? "",
    active: policy?.active ?? true,
    priority: policy?.priority ?? 1,
    // The backend represents an empty action list as {"": true}.
    actions: Object.fromEntries(
      Object.entries(policy?.action ?? {}).filter(([key]) => key !== "")
    ),
    realm: [...(policy?.realm ?? [])],
    resolver: [...(policy?.resolver ?? [])],
    adminrealm: [...(policy?.adminrealm ?? [])],
    edumfanode: [...(policy?.edumfanode ?? [])],
    user: (policy?.user ?? []).join(", "),
    adminuser: (policy?.adminuser ?? []).join(", "),
    client: (policy?.client ?? []).join(", "),
    time: policy?.time ?? "",
    checkAllResolvers: policy?.check_all_resolvers ?? false,
    conditions: (policy?.conditions ?? []).map((condition) => [...condition])
  };
}

export function buildPolicyRequest(form: PolicyFormValues): PolicyWriteRequest {
  const action: PolicyActions = Object.fromEntries(
    Object.entries(form.actions).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(" ") : value
    ])
  );
  return {
    action,
    active: form.active,
    scope: form.scope,
    priority: Number(form.priority),
    realm: form.realm,
    resolver: form.resolver,
    adminrealm: form.adminrealm,
    edumfanode: form.edumfanode,
    user: splitList(form.user),
    adminuser: splitList(form.adminuser),
    client: splitList(form.client),
    time: form.time,
    check_all_resolvers: form.checkAllResolvers,
    conditions: form.conditions
  };
}

export function isPolicyNameValid(name: string): boolean {
  return (
    name.trim() !== "" &&
    /^[a-zA-Z0-9_. -]+$/.test(name) &&
    !/^(check|defs)$|^edumfa-update-policy-/i.test(name)
  );
}

export function isPolicyFormValid(
  form: PolicyFormValues,
  definitions: PolicyDefinitions
): boolean {
  if (
    !isPolicyNameValid(form.name) ||
    !form.scope ||
    form.priority === "" ||
    !Number.isInteger(Number(form.priority)) ||
    Number(form.priority) < 1
  )
    return false;
  if (
    form.conditions.some(
      ([section, key, comparator, , active]) =>
        active && (!section || !key.trim() || !comparator)
    )
  )
    return false;
  return Object.entries(form.actions).every(([name, value]) => {
    const spec = definitions[form.scope]?.[name];
    // Preserve actions from plugins/versions whose definitions are unavailable.
    if (!spec || spec.type === "bool") return true;
    if (
      typeof value === "boolean" ||
      value === "" ||
      (Array.isArray(value) && !value.length)
    )
      return false;
    return spec.type !== "int" || Number.isInteger(Number(value));
  });
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function describePolicyActions(actions: PolicyActions): string {
  return Object.entries(actions)
    .filter(([key]) => key)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}
