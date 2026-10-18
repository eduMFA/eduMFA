import type { PolicyActionDefinition } from "@/api/policies";
import type { TypedOptionValue } from "@/components/forms/TypedOptionInput";

export type PolicyActionEntry = [string, PolicyActionDefinition];

/** The defined actions plus any stored action the definitions no longer know, sorted by name. */
export function listPolicyActionEntries(
  definitions: Record<string, PolicyActionDefinition>,
  actions: Record<string, TypedOptionValue>
): PolicyActionEntry[] {
  const known = Object.entries(definitions);
  const unknown: PolicyActionEntry[] = Object.keys(actions)
    .filter((key) => !(key in definitions))
    .map((key) => [key, { type: typeof actions[key] === "boolean" ? "bool" : "str" }]);
  return [...known, ...unknown].sort(([a], [b]) => a.localeCompare(b));
}

/** Multi-value actions are stored space separated; the input works on the list. */
export function policyActionValue(
  spec: PolicyActionDefinition,
  rawValue: TypedOptionValue | undefined
): TypedOptionValue | undefined {
  return spec.multiple && typeof rawValue === "string"
    ? rawValue.split(/\s+/).filter(Boolean)
    : rawValue;
}

/** The offered choices, with a stored value they no longer contain put first. */
export function policyActionChoices(
  spec: PolicyActionDefinition,
  value: TypedOptionValue | undefined
): (number | string)[] | undefined {
  const choices = spec.value === undefined ? undefined : [...spec.value];
  if (
    choices &&
    !spec.multiple &&
    (typeof value === "number" || typeof value === "string") &&
    !choices.some((choice) => String(choice) === String(value))
  )
    choices.unshift(value);
  return choices;
}
