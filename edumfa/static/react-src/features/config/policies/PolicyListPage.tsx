import { Trans, useLingui } from "@lingui/react/macro";
import { IconTrash } from "@tabler/icons-react";
import { Alert, Anchor, Button, NumberInput, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  describePolicyActions,
  buildPolicyRequest,
  readPolicyForm
} from "./policyForm";
import { PolicySidebar } from "./PolicySidebar";
import { usePolicyMutations } from "./usePolicyMutations";
import { useApiClient } from "@/api/ApiClientProvider";
import { listPolicies, policyQueryKeys, type Policy } from "@/api/policies";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ActiveToggleBadge } from "@/components/feedback/ActiveToggleBadge";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort
} from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

export function PolicyListPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();
  const canRead = hasRight(rights, "policyread");
  const canWrite = hasRight(rights, "policywrite");
  const canDelete = hasRight(rights, "policydelete");
  const [filters, setFilters] = useState({ name: "", scope: "", action: "" });
  const [sort, setSort] = useState<DataTableSort>({ by: "priority", direction: "asc" });
  const policiesQuery = useQuery({
    enabled: isAuthenticated && canRead,
    queryFn: ({ signal }) => listPolicies(apiClient, signal),
    queryKey: policyQueryKeys.list
  });
  const mutations = usePolicyMutations();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const filtered = (policiesQuery.data ?? []).filter(
    (policy) =>
      policy.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      policy.scope.toLowerCase().includes(filters.scope.toLowerCase()) &&
      describePolicyActions(policy.action)
        .toLowerCase()
        .includes(filters.action.toLowerCase())
  );
  const rows = [...filtered].sort((left, right) => {
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
  const filter = (key: keyof typeof filters, label: string) => (
    <ColumnFilter
      label={label}
      value={filters[key]}
      onChange={(value) => {
        setFilters((previous) => ({ ...previous, [key]: value }));
      }}
    />
  );
  const columns: DataTableColumn<Policy>[] = [
    {
      key: "priority",
      header: <Trans>Priority</Trans>,
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
      header: <Trans>Active</Trans>,
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
      header: <Trans>Policy Name</Trans>,
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
      header: <Trans>Scope</Trans>,
      sortKey: "scope",
      filter: filter("scope", t`Filter scope`),
      render: (policy) => policy.scope
    },
    {
      key: "action",
      header: <Trans>Action</Trans>,
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
      header: <Trans>Realm</Trans>,
      render: (policy) => policy.realm.join(", ")
    },
    {
      key: "user",
      header: <Trans>User</Trans>,
      render: (policy) => policy.user.join(", ")
    },
    {
      key: "resolver",
      header: <Trans>Resolver</Trans>,
      render: (policy) => policy.resolver.join(", ")
    },
    {
      key: "client",
      header: <Trans>Client</Trans>,
      render: (policy) => policy.client.join(", ")
    },
    {
      key: "delete",
      header: "",
      render: (policy) =>
        canDelete ? (
          <Button
            color="red"
            leftSection={<IconTrash aria-hidden size={16} />}
            size="xs"
            variant="light"
            disabled={mutations.busy}
            onClick={() => {
              requestDelete({
                identifier: policy.name,
                question: <Trans>Do you really want to delete this policy?</Trans>,
                onConfirm: () => {
                  mutations.remove.mutate(policy.name);
                }
              });
            }}
          >
            <Trans>Delete</Trans>
          </Button>
        ) : null
    }
  ];

  return (
    <SidebarLayout sidebar={<PolicySidebar active="list" />}>
      <PageHeader title={<Trans>All Policies</Trans>} />
      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : !canRead ? (
        <Alert color="yellow" role="alert">
          <Trans>You do not have permission to read policies.</Trans>
        </Alert>
      ) : (
        <>
          <ErrorAlert error={policiesQuery.error} />
          <ErrorAlert
            error={
              mutations.save.error ?? mutations.toggle.error ?? mutations.remove.error
            }
          />
          <Card flush>
            {policiesQuery.isLoading ? <LoadingIndicator /> : null}
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage={<Trans>No policies found.</Trans>}
              getRowKey={(policy) => policy.name}
              isLoading={policiesQuery.data === undefined}
              sort={sort}
              onSortChange={setSort}
              minWidth={1000}
            />
          </Card>
        </>
      )}
      {dialog}
    </SidebarLayout>
  );
}

function PolicyPriority({
  disabled,
  name,
  priority,
  onSave
}: {
  disabled: boolean;
  name: string;
  priority: number;
  onSave: (value: number) => void;
}) {
  const { t } = useLingui();
  const [value, setValue] = useState<number | string>(priority);
  const valid = typeof value === "number" && Number.isInteger(value) && value >= 1;
  return (
    <NumberInput
      allowDecimal={false}
      aria-label={t`Priority for ${name}`}
      disabled={disabled}
      error={!valid}
      min={1}
      value={value}
      onChange={setValue}
      w={90}
      size="xs"
      onBlur={() => {
        if (valid && value !== priority) onSave(value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

function truncate(value: string) {
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}
