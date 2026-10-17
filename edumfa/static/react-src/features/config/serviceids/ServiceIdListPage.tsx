import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Text } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { getServiceIds } from "@/api/config";
import { deleteServiceId, serviceIdQueryKeys } from "@/api/serviceIds";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { SystemLayout } from "@/features/config/system/SystemLayout";
import { popFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { notify } from "@/lib/notify";

/** The legacy list cut the description with `limitTo: 20`. */
const DESCRIPTION_LIMIT = 20;

interface ServiceIdRow {
  description: string;
  id: number | undefined;
  servicename: string;
}

/** Port of `config.serviceid.list.html` and the list part of `serviceidController`. */
export function ServiceIdListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const canAdd = hasRight(rights, "serviceid_add");
  const canDelete = hasRight(rights, "serviceid_delete");

  // "Service ID saved." handed over by the edit page.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const serviceIdsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getServiceIds(apiClient, signal),
    queryKey: serviceIdQueryKeys.all
  });

  const deleteMutation = useMutation({
    mutationFn: (servicename: string) => deleteServiceId(apiClient, servicename),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceIdQueryKeys.all });
    }
  });

  const rows: ServiceIdRow[] = Object.entries(serviceIdsQuery.data ?? {}).map(
    ([servicename, service]) => ({
      description: service.description ?? "",
      id: service.id,
      servicename
    })
  );

  const columns: DataTableColumn<ServiceIdRow>[] = [
    {
      header: <Trans>Id</Trans>,
      key: "id",
      render: (row) => row.id,
      width: 80
    },
    {
      header: <Trans>Name</Trans>,
      key: "name",
      render: (row) => (
        <Anchor
          href={hashHref(
            `/config/serviceid/edit/${encodeURIComponent(row.servicename)}`
          )}
          size="sm"
        >
          {row.servicename}
        </Anchor>
      )
    },
    {
      header: <Trans>Description</Trans>,
      key: "description",
      render: (row) => (
        <Text size="sm" title={row.description}>
          {truncateDescription(row.description)}
        </Text>
      )
    },
    ...(canDelete
      ? [
          {
            align: "right",
            header: <Trans>Actions</Trans>,
            key: "actions",
            render: (row) => (
              <Button
                color="red"
                leftSection={<IconTrash size={14} />}
                loading={
                  deleteMutation.isPending &&
                  deleteMutation.variables === row.servicename
                }
                onClick={() => {
                  requestDelete({
                    identifier: row.servicename,
                    onConfirm: () => {
                      deleteMutation.mutate(row.servicename);
                    }
                  });
                }}
                size="xs"
                variant="light"
              >
                <Trans>Delete</Trans>
              </Button>
            )
          } satisfies DataTableColumn<ServiceIdRow>
        ]
      : [])
  ];

  return (
    <SystemLayout activeItem="serviceid">
      <PageHeader
        actions={
          canAdd ? (
            <Button
              component="a"
              href={hashHref("/config/serviceid/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              <Trans>New Service ID definition</Trans>
            </Button>
          ) : null
        }
        subtitle={
          <Trans>
            Service IDs can be used to attach e.g. SSH keys to certain machines and
            services. To view attached tokens go to{" "}
            <Anchor href={hashHref("/token/applications/ssh")} inherit>
              token applications
            </Anchor>
            .
          </Trans>
        }
        title={<Trans>Service IDs</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={serviceIdsQuery.error} />
      <ErrorAlert error={deleteMutation.error} />

      <Card flush>
        {serviceIdsQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading service IDs</Trans>} />
        ) : null}

        <DataTable
          columns={columns}
          data={rows}
          emptyMessage={<Trans>No service IDs defined.</Trans>}
          getRowKey={(row) => row.servicename}
          id="tableserviceids"
          isLoading={serviceIdsQuery.data === undefined}
          minWidth={480}
        />
      </Card>

      {dialog}
    </SystemLayout>
  );
}

function truncateDescription(description: string): string {
  return description.length > DESCRIPTION_LIMIT
    ? `${description.slice(0, DESCRIPTION_LIMIT)}…`
    : description;
}
