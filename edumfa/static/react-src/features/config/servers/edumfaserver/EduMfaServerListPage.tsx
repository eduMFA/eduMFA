import { Trans } from "@lingui/react/macro";
import { Anchor, Button } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { isConfigEnabled } from "@/api/config";
import {
  deleteEduMfaServer,
  getEduMfaServers,
  serverQueryKeys,
  type EduMfaServer
} from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { BooleanPill } from "@/components/feedback/BooleanPill";
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
import { truncate } from "@/lib/strings";

interface EduMfaServerRow extends EduMfaServer {
  identifier: string;
}

/** Port of `config.edumfaserver.list.html` and the list part of `eduMfaServerController`. */
export function EduMfaServerListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const canWrite = hasRight(rights, "edumfaserver_write");
  const { dialog, requestDelete } = useDeleteConfirmation();

  // The edit page leaves its "saved" notice for this page.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const serversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getEduMfaServers(apiClient, signal),
    queryKey: serverQueryKeys.eduMfaServers
  });

  const deleteMutation = useMutation({
    mutationFn: (identifier: string) => deleteEduMfaServer(apiClient, identifier),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.eduMfaServers });
    }
  });

  const rows: EduMfaServerRow[] = Object.entries(serversQuery.data ?? {}).map(
    ([identifier, server]) => ({ ...server, identifier })
  );

  const columns: DataTableColumn<EduMfaServerRow>[] = [
    {
      header: <Trans>Identifier</Trans>,
      key: "identifier",
      render: (row) => (
        <Anchor
          href={hashHref(
            `/config/edumfaserver/edit/${encodeURIComponent(row.identifier)}`
          )}
          size="sm"
        >
          {row.identifier}
        </Anchor>
      )
    },
    {
      header: <Trans>URL</Trans>,
      key: "url",
      render: (row) => row.url
    },
    {
      header: <Trans>Verify TLS</Trans>,
      key: "tls",
      render: (row) => <BooleanPill value={isConfigEnabled(row.tls)} />
    },
    {
      header: <Trans>Description</Trans>,
      key: "description",
      render: (row) => truncate(row.description ?? "", 20)
    },
    {
      align: "right",
      header: <Trans>Actions</Trans>,
      key: "actions",
      render: (row) =>
        canWrite ? (
          <Button
            color="red"
            leftSection={<IconTrash size={14} />}
            loading={
              deleteMutation.isPending && deleteMutation.variables === row.identifier
            }
            onClick={() => {
              requestDelete({
                identifier: row.identifier,
                onConfirm: () => {
                  deleteMutation.mutate(row.identifier);
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
    <SystemLayout activeItem="edumfaserver">
      <PageHeader
        actions={
          canWrite ? (
            <Button
              component="a"
              href={hashHref("/config/edumfaserver/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              <Trans>New eduMFA server</Trans>
            </Button>
          ) : null
        }
        title={<Trans>eduMFA servers</Trans>}
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={serversQuery.error} />
          <ErrorAlert error={deleteMutation.error} />

          <Card flush>
            {serversQuery.isLoading ? (
              <LoadingIndicator label={<Trans>Loading eduMFA servers</Trans>} />
            ) : null}
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage={<Trans>No eduMFA servers defined.</Trans>}
              getRowKey={(row) => row.identifier}
              id="tableedumfaservers"
              isLoading={serversQuery.data === undefined}
            />
          </Card>
          {dialog}
        </>
      )}
    </SystemLayout>
  );
}
