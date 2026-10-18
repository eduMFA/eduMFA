import { describePolicyActions } from "./policyForm";
import type { Policy } from "@/api/policies";
import type { DataTableSort } from "@/components/tables/DataTable";

export interface PolicyFilters {
  action: string;
  name: string;
  scope: string;
}

/** Case-insensitive substring match on name, scope and the described actions. */
export function filterPolicies(
  policies: readonly Policy[],
  filters: PolicyFilters
): Policy[] {
  return policies.filter(
    (policy) =>
      policy.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      policy.scope.toLowerCase().includes(filters.scope.toLowerCase()) &&
      describePolicyActions(policy.action)
        .toLowerCase()
        .includes(filters.action.toLowerCase())
  );
}

/** Sorts a copy by the chosen column; ties fall back to the name. */
export function sortPolicies(
  policies: readonly Policy[],
  sort: DataTableSort
): Policy[] {
  return [...policies].sort((left, right) => {
    const value = (policy: Policy) => {
      if (sort.by === "priority") return policy.priority;
      if (sort.by === "active") return Number(policy.active);
      if (sort.by === "scope") return policy.scope;
      if (sort.by === "action") return describePolicyActions(policy.action);
      return policy.name;
    };
    const a = value(left),
      b = value(right);
    const comparison =
      typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b));
    return (
      (comparison || left.name.localeCompare(right.name)) *
      (sort.direction === "asc" ? 1 : -1)
    );
  });
}
