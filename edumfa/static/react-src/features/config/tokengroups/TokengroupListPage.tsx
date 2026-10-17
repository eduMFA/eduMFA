import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Text } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { getTokengroups } from "@/api/config";
import { deleteTokengroup, tokengroupQueryKeys } from "@/api/tokengroups";
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

interface TokengroupRow {
  description: string;
  groupname: string;
  id: number | undefined;
}

/** Port of `config.tokengroup.list.html` and the list part of `tokengroupController`. */
export function TokengroupListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const canAdd = hasRight(rights, "tokengroup_add");
  const canDelete = hasRight(rights, "tokengroup_delete");

  // "Tokengroup saved." handed over by the edit page.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const tokengroupsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getTokengroups(apiClient, signal),
    queryKey: tokengroupQueryKeys.all
  });

  const deleteMutation = useMutation({
    mutationFn: (groupname: string) => deleteTokengroup(apiClient, groupname),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokengroupQueryKeys.all });
    }
  });

  const rows: TokengroupRow[] = Object.entries(tokengroupsQuery.data ?? {}).map(
    ([groupname, group]) => ({
      description: group.description ?? "",
      groupname,
      id: group.id
    })
  );

  const columns: DataTableColumn<TokengroupRow>[] = [
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
            `/config/tokengroup/edit/${encodeURIComponent(row.groupname)}`
          )}
          size="sm"
        >
          {row.groupname}
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
                  deleteMutation.isPending && deleteMutation.variables === row.groupname
                }
                onClick={() => {
                  requestDelete({
                    identifier: row.groupname,
                    onConfirm: () => {
                      deleteMutation.mutate(row.groupname);
                    }
                  });
                }}
                size="xs"
                variant="light"
              >
                <Trans>Delete</Trans>
              </Button>
            )
          } satisfies DataTableColumn<TokengroupRow>
        ]
      : [])
  ];

  return (
    <SystemLayout activeItem="tokengroup">
      <PageHeader
        actions={
          canAdd ? (
            <Button
              component="a"
              href={hashHref("/config/tokengroup/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              <Trans>New Tokengroup definition</Trans>
            </Button>
          ) : null
        }
        title={<Trans>Tokengroups</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={tokengroupsQuery.error} />
      <ErrorAlert error={deleteMutation.error} />

      <Card flush>
        {tokengroupsQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading tokengroups</Trans>} />
        ) : null}

        <DataTable
          columns={columns}
          data={rows}
          emptyMessage={<Trans>No tokengroups defined.</Trans>}
          getRowKey={(row) => row.groupname}
          id="tabletokengroups"
          isLoading={tokengroupsQuery.data === undefined}
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
