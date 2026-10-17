import { Trans } from "@lingui/react/macro";
import { Anchor, Button } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  deleteSmsGateway,
  getSmsGateways,
  serverQueryKeys,
  type SmsGateway
} from "@/api/servers";
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

/** Port of `config.smsgateway.list.html` and the list part of `smsgatewayController`. */
export function SmsGatewayListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const canWrite = hasRight(rights, "smsgateway_write");
  const { dialog, requestDelete } = useDeleteConfirmation();

  const gatewaysQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSmsGateways(apiClient, signal),
    queryKey: serverQueryKeys.smsGateways
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteSmsGateway(apiClient, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.smsGateways });
    }
  });

  const columns: DataTableColumn<SmsGateway>[] = [
    {
      header: <Trans>Name</Trans>,
      key: "name",
      render: (gateway) => (
        <Anchor
          href={hashHref(`/config/smsgateway/edit/${String(gateway.id)}`)}
          size="sm"
        >
          {gateway.name}
        </Anchor>
      )
    },
    {
      header: <Trans>Description</Trans>,
      key: "description",
      render: (gateway) => gateway.description
    },
    {
      header: <Trans>Providermodule</Trans>,
      key: "providermodule",
      render: (gateway) => gateway.providermodule
    },
    {
      align: "right",
      header: <Trans>Actions</Trans>,
      key: "actions",
      render: (gateway) =>
        canWrite ? (
          <Button
            color="red"
            leftSection={<IconTrash size={14} />}
            loading={
              deleteMutation.isPending && deleteMutation.variables === gateway.name
            }
            onClick={() => {
              requestDelete({
                identifier: gateway.name,
                onConfirm: () => {
                  deleteMutation.mutate(gateway.name);
                }
              });
            }}
            size="xs"
            variant="light"
          >
            <Trans>Delete</Trans>
          </Button>
        ) : null
    }
  ];

  return (
    <SystemLayout activeItem="smsgateway">
      <PageHeader
        actions={
          canWrite ? (
            <Button
              component="a"
              href={hashHref("/config/smsgateway/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              <Trans>Create new SMS Gateway definition</Trans>
            </Button>
          ) : null
        }
        title={<Trans>SMS Gateways</Trans>}
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={gatewaysQuery.error} />
          <ErrorAlert error={deleteMutation.error} />

          <Card flush>
            {gatewaysQuery.isLoading ? (
              <LoadingIndicator label={<Trans>Loading SMS gateways</Trans>} />
            ) : null}
            <DataTable
              columns={columns}
              data={gatewaysQuery.data ?? []}
              emptyMessage={<Trans>No SMS gateways defined.</Trans>}
              getRowKey={(gateway) => String(gateway.id)}
              id="tablesmsgateways"
              isLoading={gatewaysQuery.data === undefined}
            />
          </Card>
          {dialog}
        </>
      )}
    </SystemLayout>
  );
}
