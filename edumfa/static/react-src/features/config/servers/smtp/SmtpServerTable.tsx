import { useLingui } from "@lingui/react/macro";
import { Anchor, Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import { isConfigEnabled } from "@/api/config";
import type { SmtpServer, SmtpServers } from "@/api/servers";
import { BooleanPill } from "@/components/feedback/BooleanPill";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { Card } from "@/components/layout/Card";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";
import { truncate } from "@/lib/strings";

interface SmtpServerRow extends SmtpServer {
  identifier: string;
}

export interface SmtpServerTableProps {
  canWrite: boolean;
  /** `undefined` until the list arrived. */
  data: SmtpServers | undefined;
  /** The definition whose deletion is in flight. */
  deletingName: string | undefined;
  isLoading: boolean;
  onDelete: (identifier: string) => void;
}

function toRows(data: SmtpServers | undefined): SmtpServerRow[] {
  return Object.entries(data ?? {}).map(([identifier, server]) => ({
    ...server,
    identifier
  }));
}

/** The table of `config.smtp.list.html`: identifier, server, sender, StartTLS and the delete action. */
export function SmtpServerTable({
  canWrite,
  data,
  deletingName,
  isLoading,
  onDelete
}: SmtpServerTableProps) {
  const { t } = useLingui();

  const columns: DataTableColumn<SmtpServerRow>[] = [
    {
      header: t`Identifier`,
      key: "identifier",
      render: (row) => (
        <Anchor
          href={hashHref(`/config/smtp/edit/${encodeURIComponent(row.identifier)}`)}
          size="sm"
        >
          {row.identifier}
        </Anchor>
      )
    },
    {
      header: t`IP/FQDN`,
      key: "server",
      render: (row) => `${row.server}:${String(row.port ?? "")}`
    },
    {
      header: t`Sender`,
      key: "sender",
      render: (row) => row.sender
    },
    {
      header: t`StartTLS`,
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
      {isLoading ? <LoadingIndicator label={t`Loading SMTP servers`} /> : null}
      <DataTable
        columns={columns}
        data={toRows(data)}
        emptyMessage={t`No SMTP servers defined.`}
        getRowKey={(row) => row.identifier}
        id="tablesmtpservers"
        isLoading={data === undefined}
      />
    </Card>
  );
}
