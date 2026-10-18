import { Trans } from "@lingui/react/macro";
import { Anchor, Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import type { RadiusServer, RadiusServers } from "@/api/servers";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { Card } from "@/components/layout/Card";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";
import { truncate } from "@/lib/strings";

interface RadiusServerRow extends RadiusServer {
  identifier: string;
}

export interface RadiusServerTableProps {
  canWrite: boolean;
  /** `undefined` until the list arrived. */
  data: RadiusServers | undefined;
  /** The definition whose deletion is in flight. */
  deletingName: string | undefined;
  isLoading: boolean;
  onDelete: (identifier: string) => void;
}

function toRows(data: RadiusServers | undefined): RadiusServerRow[] {
  return Object.entries(data ?? {}).map(([identifier, server]) => ({
    ...server,
    identifier
  }));
}

/** The table of `config.radius.list.html`: identifier, server, dictionary and the delete action. */
export function RadiusServerTable({
  canWrite,
  data,
  deletingName,
  isLoading,
  onDelete
}: RadiusServerTableProps) {
  const columns: DataTableColumn<RadiusServerRow>[] = [
    {
      header: <Trans>Identifier</Trans>,
      key: "identifier",
      render: (row) => (
        <Anchor
          href={hashHref(`/config/radius/edit/${encodeURIComponent(row.identifier)}`)}
          size="sm"
        >
          {row.identifier}
        </Anchor>
      )
    },
    {
      header: <Trans>IP/FQDN</Trans>,
      key: "server",
      render: (row) => `${row.server}:${String(row.port ?? "")}`
    },
    {
      header: <Trans>Dictionary</Trans>,
      key: "dictionary",
      render: (row) => row.dictionary
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
            loading={deletingName === row.identifier}
            onClick={() => {
              onDelete(row.identifier);
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
    <Card flush>
      {isLoading ? (
        <LoadingIndicator label={<Trans>Loading RADIUS servers</Trans>} />
      ) : null}
      <DataTable
        columns={columns}
        data={toRows(data)}
        emptyMessage={<Trans>No RADIUS servers defined.</Trans>}
        getRowKey={(row) => row.identifier}
        id="tableradiusservers"
        isLoading={data === undefined}
      />
    </Card>
  );
}
