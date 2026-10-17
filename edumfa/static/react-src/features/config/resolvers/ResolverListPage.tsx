import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Group } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { isResolverType, resolverEditorPath } from "./resolverTypes";
import { ResolverSidebar } from "./ResolverSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getResolvers, type ResolverConfig } from "@/api/config";
import { deleteResolver, resolverQueryKeys } from "@/api/resolvers";
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
import { popFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { notify } from "@/lib/notify";

/**
 * Port of `config.resolvers.list.html`: every user resolver with its type,
 * an edit link and the delete action (`resolverdelete`, asked about when
 * the `deletion_confirmation` policy is set).
 */
export function ResolverListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();

  // Notices handed over by the editors, e.g. the LDAP restart reminder.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const resolversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getResolvers(apiClient, undefined, signal),
    queryKey: configQueryKeys.resolvers()
  });

  const deleteMutation = useMutation({
    mutationFn: (resolverName: string) => deleteResolver(apiClient, resolverName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resolverQueryKeys.lists });
    }
  });

  const resolvers = Object.values(resolversQuery.data ?? {});
  const canDelete = hasRight(rights, "resolverdelete");

  const columns: DataTableColumn<ResolverConfig>[] = [
    {
      header: <Trans>Resolver name</Trans>,
      key: "resolvername",
      render: (resolver) =>
        isResolverType(resolver.type) ? (
          <Anchor
            href={hashHref(resolverEditorPath(resolver.type, resolver.resolvername))}
            size="sm"
          >
            {resolver.resolvername}
          </Anchor>
        ) : (
          resolver.resolvername
        )
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
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          {isResolverType(resolver.type) ? (
            <Button
              component="a"
              href={hashHref(resolverEditorPath(resolver.type, resolver.resolvername))}
              leftSection={<IconEdit size={14} />}
              size="xs"
              variant="light"
            >
              <Trans>Edit</Trans>
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              color="red"
              leftSection={<IconTrash size={14} />}
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables === resolver.resolvername
              }
              onClick={() => {
                requestDelete({
                  identifier: resolver.resolvername,
                  onConfirm: () => {
                    deleteMutation.mutate(resolver.resolvername);
                  },
                  question: <Trans>Do you really want to delete this resolver?</Trans>
                });
              }}
              size="xs"
              variant="light"
            >
              <Trans>Delete</Trans>
            </Button>
          ) : null}
        </Group>
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
