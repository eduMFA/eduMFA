import { useLingui } from "@lingui/react/macro";
import { Anchor, Text } from "@mantine/core";
import type { Dispatch, SetStateAction } from "react";

import { PolicyDeleteButton } from "./PolicyDeleteButton";
import {
  describePolicyActions,
  buildPolicyRequest,
  readPolicyForm
} from "./policyForm";
import type { PolicyFilters } from "./policyListRows";
import { PolicyPriority } from "./PolicyPriority";
import type { PolicyMutations } from "./types";
import type { Policy } from "@/api/policies";
import { ActiveToggleBadge } from "@/components/feedback/ActiveToggleBadge";
import type { DeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import type { DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

/** The columns of the policy table, with inline priority, toggle and delete as the rights allow. */
export function usePolicyListColumns({
  canDelete,
  canWrite,
  filters,
  mutations,
  onFiltersChange,
  requestDelete
}: {
  canDelete: boolean;
  canWrite: boolean;
  filters: PolicyFilters;
  mutations: PolicyMutations;
  onFiltersChange: Dispatch<SetStateAction<PolicyFilters>>;
  requestDelete: DeleteConfirmation["requestDelete"];
}): DataTableColumn<Policy>[] {
  const { t } = useLingui();
  const filter = (key: keyof PolicyFilters, label: string) => (
    <ColumnFilter
      label={label}
      value={filters[key]}
      onChange={(value) => {
        onFiltersChange((previous) => ({ ...previous, [key]: value }));
      }}
    />
  );
  return [
    {
      key: "priority",
      header: t`Priority`,
      sortKey: "priority",
      render: (policy) =>
        canWrite ? (
          <PolicyPriority
            key={`${policy.name}:${String(policy.priority)}`}
            disabled={mutations.busy}
            name={policy.name}
            priority={policy.priority}
            onSave={(priority) => {
              if (!mutations.busy)
                mutations.save.mutate({
                  name: policy.name,
                  request: { ...buildPolicyRequest(readPolicyForm(policy)), priority }
                });
            }}
          />
        ) : (
          policy.priority
        )
    },
    {
      key: "active",
      header: t`Active`,
      sortKey: "active",
      render: (policy) => (
        <ActiveToggleBadge
          active={policy.active}
          disableLabel={t`Disable policy ${policy.name}`}
          enableLabel={t`Enable policy ${policy.name}`}
          onToggle={
            canWrite && !mutations.busy
              ? () => {
                  mutations.toggle.mutate({
                    name: policy.name,
                    active: !policy.active
                  });
                }
              : undefined
          }
        />
      )
    },
    {
      key: "name",
      header: t`Policy Name`,
      sortKey: "name",
      filter: filter("name", t`Filter policy name`),
      render: (policy) => (
        <Anchor
          href={hashHref(`/config/policies/details/${encodeURIComponent(policy.name)}`)}
          size="sm"
        >
          {policy.name}
        </Anchor>
      )
    },
    {
      key: "scope",
      header: t`Scope`,
      sortKey: "scope",
      filter: filter("scope", t`Filter scope`),
      render: (policy) => policy.scope
    },
    {
      key: "action",
      header: t`Action`,
      sortKey: "action",
      filter: filter("action", t`Filter actions`),
      render: (policy) => (
        <Text size="sm" title={describePolicyActions(policy.action)}>
          {truncate(describePolicyActions(policy.action))}
        </Text>
      )
    },
    {
      key: "realm",
      header: t`Realm`,
      render: (policy) => policy.realm.join(", ")
    },
    {
      key: "user",
      header: t`User`,
      render: (policy) => policy.user.join(", ")
    },
    {
      key: "resolver",
      header: t`Resolver`,
      render: (policy) => policy.resolver.join(", ")
    },
    {
      key: "client",
      header: t`Client`,
      render: (policy) => policy.client.join(", ")
    },
    {
      key: "delete",
      header: "",
      render: (policy) =>
        canDelete ? (
          <PolicyDeleteButton
            disabled={mutations.busy}
            name={policy.name}
            requestDelete={requestDelete}
            onConfirm={() => {
              mutations.remove.mutate(policy.name);
            }}
          />
        ) : null
    }
  ];
}

function truncate(value: string) {
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}
