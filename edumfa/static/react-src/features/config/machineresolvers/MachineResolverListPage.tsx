import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Group } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MachineResolverSidebar } from "./MachineResolverSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  deleteMachineResolver,
  getMachineResolvers,
  machineResolverQueryKeys,
  type MachineResolverConfig
} from "@/api/machineResolvers";
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
import { hashHref } from "@/lib/hashbang";

/** The editor of a resolver: `config.mresolvers.edit<type>` in the legacy states. */
export function machineResolverEditHref(
  resolver: Pick<MachineResolverConfig, "resolvername" | "type">
): string {
  return hashHref(
    `/config/machineresolvers/${encodeURIComponent(resolver.type)}/${encodeURIComponent(resolver.resolvername)}`
  );
}

/**
 * Port of `config.mresolvers.list.html` and `machineResolverController`:
 * the resolver table with the edit link and the (confirmed) delete action.
 */
export function MachineResolverListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();

  const resolversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getMachineResolvers(apiClient, signal),
    queryKey: machineResolverQueryKeys.list
  });
  const deleteMutation = useMutation({
    mutationFn: (resolverName: string) =>
      deleteMachineResolver(apiClient, resolverName),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: machineResolverQueryKeys.all })
  });

  const canDelete = hasRight(rights, "mresolverdelete");
  const resolvers = Object.values(resolversQuery.data ?? {});

  const columns: DataTableColumn<MachineResolverConfig>[] = [
    {
      header: <Trans>Resolver name</Trans>,
      key: "resolvername",
      render: (resolver) => (
        <Anchor href={machineResolverEditHref(resolver)} size="sm">
          {resolver.resolvername}
        </Anchor>
      )
    },
    {
      header: <Trans>type</Trans>,
      key: "type",
      render: (resolver) => resolver.type
    },
    {
      align: "right",
      header: <Trans>Actions</Trans>,
      key: "actions",
      render: (resolver) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Button
            component="a"
            href={machineResolverEditHref(resolver)}
            leftSection={<IconPencil size={14} />}
            size="xs"
            variant="light"
          >
            <Trans>Edit</Trans>
          </Button>
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
                  question: (
                    <Trans>Do you really want to delete this machine resolver?</Trans>
                  )
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
    <SidebarLayout sidebar={<MachineResolverSidebar activeItem="list" />}>
      <PageHeader title={<Trans>Machine Resolvers</Trans>} />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={resolversQuery.error} />
          <ErrorAlert error={deleteMutation.error} />

          <Card flush>
            {resolversQuery.isLoading ? (
              <LoadingIndicator label={<Trans>Loading machine resolvers</Trans>} />
            ) : null}
            <DataTable
              columns={columns}
              data={resolvers}
              emptyMessage={<Trans>No machine resolvers defined.</Trans>}
              getRowKey={(resolver) => resolver.resolvername}
              id="tablemachineresolvers"
              isLoading={resolversQuery.data === undefined}
              minWidth={480}
            />
          </Card>
          {dialog}
        </>
      )}
    </SidebarLayout>
  );
}
