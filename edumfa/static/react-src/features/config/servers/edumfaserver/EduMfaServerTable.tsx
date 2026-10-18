import { Trans } from "@lingui/react/macro";
import { Anchor, Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import { isConfigEnabled } from "@/api/config";
import type { EduMfaServer, EduMfaServers } from "@/api/servers";
import { BooleanPill } from "@/components/feedback/BooleanPill";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { Card } from "@/components/layout/Card";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";
import { truncate } from "@/lib/strings";

interface EduMfaServerRow extends EduMfaServer {
  identifier: string;
}

export interface EduMfaServerTableProps {
  canWrite: boolean;
  /** `undefined` until the list arrived. */
  data: EduMfaServers | undefined;
  /** The definition whose deletion is in flight. */
  deletingName: string | undefined;
  isLoading: boolean;
  onDelete: (identifier: string) => void;
}

function toRows(data: EduMfaServers | undefined): EduMfaServerRow[] {
  return Object.entries(data ?? {}).map(([identifier, server]) => ({
    ...server,
    identifier
  }));
}

/** The table of `config.edumfaserver.list.html`: identifier, URL, TLS and the delete action. */
export function EduMfaServerTable({
  canWrite,
  data,
  deletingName,
  isLoading,
  onDelete
}: EduMfaServerTableProps) {
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
        <LoadingIndicator label={<Trans>Loading eduMFA servers</Trans>} />
      ) : null}
      <DataTable
        columns={columns}
        data={toRows(data)}
        emptyMessage={<Trans>No eduMFA servers defined.</Trans>}
        getRowKey={(row) => row.identifier}
        id="tableedumfaservers"
        isLoading={data === undefined}
      />
    </Card>
  );
}
