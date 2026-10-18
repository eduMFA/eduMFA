import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  const columns: DataTableColumn<EduMfaServerRow>[] = [
    {
      header: t`Identifier`,
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
      header: t`URL`,
      key: "url",
      render: (row) => row.url
    },
    {
      header: t`Verify TLS`,
      key: "tls",
      render: (row) => <BooleanPill value={isConfigEnabled(row.tls)} />
    },
    {
      header: t`Description`,
      key: "description",
      render: (row) => truncate(row.description ?? "", 20)
    },
    {
      align: "right",
      header: t`Actions`,
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
            {t`Delete`}
          </Button>
        ) : null
    }
  ];

  return (
    <Card flush>
      {isLoading ? <LoadingIndicator label={t`Loading eduMFA servers`} /> : null}
      <DataTable
        columns={columns}
        data={toRows(data)}
        emptyMessage={t`No eduMFA servers defined.`}
        getRowKey={(row) => row.identifier}
        id="tableedumfaservers"
        isLoading={data === undefined}
      />
    </Card>
  );
}
