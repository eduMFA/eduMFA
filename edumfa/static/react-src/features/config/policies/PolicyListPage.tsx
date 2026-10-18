import { useLingui } from "@lingui/react/macro";
import {} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { filterPolicies, sortPolicies, type PolicyFilters } from "./policyListRows";
import { PolicySidebar } from "./PolicySidebar";
import { usePolicyListColumns } from "./usePolicyListColumns";
import { usePolicyMutations } from "./usePolicyMutations";
import { useApiClient } from "@/api/ApiClientProvider";
import { listPolicies, policyQueryKeys } from "@/api/policies";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { AccessGate } from "@/components/feedback/AccessGate";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DataTable, type DataTableSort } from "@/components/tables/DataTable";

export function PolicyListPage() {
  const { t } = useLingui();

  const apiClient = useApiClient();
  const { isAuthenticated, rights } = useAuth();
  const canRead = hasRight(rights, "policyread");
  const canWrite = hasRight(rights, "policywrite");
  const canDelete = hasRight(rights, "policydelete");
  const [filters, setFilters] = useState<PolicyFilters>({
    name: "",
    scope: "",
    action: ""
  });
  const [sort, setSort] = useState<DataTableSort>({ by: "priority", direction: "asc" });
  const policiesQuery = useQuery({
    enabled: isAuthenticated && canRead,
    queryFn: ({ signal }) => listPolicies(apiClient, signal),
    queryKey: policyQueryKeys.list
  });
  const mutations = usePolicyMutations();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const rows = sortPolicies(filterPolicies(policiesQuery.data ?? [], filters), sort);
  const columns = usePolicyListColumns({
    canDelete,
    canWrite,
    filters,
    mutations,
    onFiltersChange: setFilters,
    requestDelete
  });

  return (
    <SidebarLayout sidebar={<PolicySidebar active="list" />}>
      <PageHeader title={t`All Policies`} />
      <AccessGate
        allowed={canRead}
        deniedMessage={t`You do not have permission to read policies.`}
        isAuthenticated={isAuthenticated}
      >
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
            emptyMessage={t`No policies found.`}
            getRowKey={(policy) => policy.name}
            isLoading={policiesQuery.data === undefined}
            sort={sort}
            onSortChange={setSort}
            minWidth={1000}
          />
        </Card>
      </AccessGate>
      {dialog}
    </SidebarLayout>
  );
}
