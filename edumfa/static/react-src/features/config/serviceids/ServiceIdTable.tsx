import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import type { ServiceIds } from "@/api/config";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { Card } from "@/components/layout/Card";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

/** The legacy list cut the description with `limitTo: 20`. */
const DESCRIPTION_LIMIT = 20;

interface ServiceIdRow {
  description: string;
  id: number | undefined;
  servicename: string;
}

export interface ServiceIdTableProps {
  canDelete: boolean;
  /** `undefined` until the list arrived. */
  data: ServiceIds | undefined;
  /** The service ID whose deletion is in flight. */
  deletingName: string | undefined;
  isLoading: boolean;
  onDelete: (servicename: string) => void;
}

function toRows(data: ServiceIds | undefined): ServiceIdRow[] {
  return Object.entries(data ?? {}).map(([servicename, service]) => ({
    description: service.description ?? "",
    id: service.id,
    servicename
  }));
}

function truncateDescription(description: string): string {
  return description.length > DESCRIPTION_LIMIT
    ? `${description.slice(0, DESCRIPTION_LIMIT)}…`
    : description;
}

/** The table of `config.serviceid.list.html`: id, name, description and the delete action. */
export function ServiceIdTable({
  canDelete,
  data,
  deletingName,
  isLoading,
  onDelete
}: ServiceIdTableProps) {
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
                loading={deletingName === row.servicename}
                onClick={() => {
                  onDelete(row.servicename);
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
    <Card flush>
      {isLoading ? (
        <LoadingIndicator label={<Trans>Loading service IDs</Trans>} />
      ) : null}

      <DataTable
        columns={columns}
        data={toRows(data)}
        emptyMessage={<Trans>No service IDs defined.</Trans>}
        getRowKey={(row) => row.servicename}
        id="tableserviceids"
        isLoading={data === undefined}
        minWidth={480}
      />
    </Card>
  );
}
