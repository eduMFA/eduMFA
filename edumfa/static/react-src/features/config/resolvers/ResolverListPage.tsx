import { Trans } from "@lingui/react/macro";

import { ResolverActionsCell } from "./ResolverActionsCell";
import { ResolverNameCell } from "./ResolverNameCell";
import { ResolverSidebar } from "./ResolverSidebar";
import { useResolverList } from "./useResolverList";
import type { ResolverConfig } from "@/api/config";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";

/**
 * Port of `config.resolvers.list.html`: every user resolver with its type,
 * an edit link and the delete action (`resolverdelete`, asked about when
 * the `deletion_confirmation` policy is set).
 */
export function ResolverListPage() {
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const { deleteMutation, resolvers, resolversQuery } = useResolverList();
  const canDelete = hasRight(rights, "resolverdelete");

  const deleteNamed = (resolverName: string) => {
    requestDelete({
      identifier: resolverName,
      onConfirm: () => {
        deleteMutation.mutate(resolverName);
      },
      question: <Trans>Do you really want to delete this resolver?</Trans>
    });
  };

  const columns: DataTableColumn<ResolverConfig>[] = [
    {
      header: <Trans>Resolver name</Trans>,
      key: "resolvername",
      render: (resolver) => <ResolverNameCell resolver={resolver} />
    },
    {
      header: <Trans>type</Trans>,
      key: "type",
      render: (resolver) => resolver.type
    },
    {
      align: "right",
      header: "",
      key: "actions",
      nowrap: true,
      render: (resolver) => (
        <ResolverActionsCell
          canDelete={canDelete}
          isDeleting={
            deleteMutation.isPending &&
            deleteMutation.variables === resolver.resolvername
          }
          onDelete={() => {
            deleteNamed(resolver.resolvername);
          }}
          resolver={resolver}
        />
      )
    }
  ];

  return (
    <SidebarLayout sidebar={<ResolverSidebar activeItem="list" />}>
      <PageHeader title={<Trans>All Resolvers</Trans>} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={resolversQuery.error} />
      <ErrorAlert error={deleteMutation.error} />

      {isAuthenticated ? (
        <Card flush>
          {resolversQuery.isLoading ? (
            <LoadingIndicator label={<Trans>Loading resolvers</Trans>} />
          ) : null}
          <DataTable
            columns={columns}
            data={resolvers}
            emptyMessage={<Trans>No resolvers defined.</Trans>}
            getRowKey={(resolver) => resolver.resolvername}
            id="resolverlist"
            isLoading={resolversQuery.data === undefined}
          />
        </Card>
      ) : null}

      {dialog}
    </SidebarLayout>
  );
}
