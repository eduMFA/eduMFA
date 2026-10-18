import { useLingui } from "@lingui/react/macro";
import { Anchor, Button, Group } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  caConnectorQueryKeys,
  deleteCaConnector,
  getCaConnectors,
  type CaConnector
} from "@/api/caConnectors";
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
import { hashHref } from "@/lib/hashbang";

/** The legacy `config.caconnectors.edit<type>` states live under the type segment. */
function editHref(connector: CaConnector): string {
  return hashHref(
    `/config/caconnectors/${encodeURIComponent(connector.type)}/${encodeURIComponent(connector.connectorname)}`
  );
}

/** Port of `config.caconnectors.list.html` and `CAConnectorController`. */
export function CaConnectorListPage() {
  const { t } = useLingui();

  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const canDelete = hasRight(rights, "caconnectordelete");

  const connectorsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getCaConnectors(apiClient, signal),
    queryKey: caConnectorQueryKeys.list
  });

  const deleteMutation = useMutation({
    mutationFn: (connectorName: string) => deleteCaConnector(apiClient, connectorName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: caConnectorQueryKeys.all });
    }
  });

  const columns: DataTableColumn<CaConnector>[] = [
    {
      header: t`CA Connector name`,
      key: "connectorname",
      render: (connector) => (
        <Anchor href={editHref(connector)} size="sm">
          {connector.connectorname}
        </Anchor>
      )
    },
    {
      header: t`type`,
      key: "type",
      render: (connector) => connector.type
    },
    {
      align: "right",
      header: t`Actions`,
      key: "actions",
      render: (connector) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Button
            component="a"
            href={editHref(connector)}
            leftSection={<IconPencil size={14} />}
            size="xs"
            variant="light"
          >
            {t`Edit`}
          </Button>
          {canDelete ? (
            <Button
              color="red"
              leftSection={<IconTrash size={14} />}
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables === connector.connectorname
              }
              onClick={() => {
                requestDelete({
                  identifier: connector.connectorname,
                  onConfirm: () => {
                    deleteMutation.mutate(connector.connectorname);
                  }
                });
              }}
              size="xs"
              variant="light"
            >
              {t`Delete`}
            </Button>
          ) : null}
        </Group>
      )
    }
  ];

  return (
    <SystemLayout activeItem="caconnectors">
      <PageHeader title={t`CA Connectors`} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={connectorsQuery.error} />
      <ErrorAlert error={deleteMutation.error} />

      <Card flush>
        {connectorsQuery.isLoading ? (
          <LoadingIndicator label={t`Loading CA connectors`} />
        ) : null}

        <DataTable
          columns={columns}
          data={connectorsQuery.data ?? []}
          emptyMessage={t`No CA connectors defined.`}
          getRowKey={(connector) => connector.connectorname}
          id="tablecaconnectors"
          isLoading={connectorsQuery.data === undefined}
          minWidth={480}
        />
      </Card>

      {dialog}
    </SystemLayout>
  );
}
