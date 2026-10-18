import { useLingui } from "@lingui/react/macro";
import { Anchor, Button, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import type { TokengroupsResponse } from "@/api/config";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { Card } from "@/components/layout/Card";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

/** The legacy list cut the description with `limitTo: 20`. */
const DESCRIPTION_LIMIT = 20;

interface TokengroupRow {
  description: string;
  groupname: string;
  id: number | undefined;
}

export interface TokengroupTableProps {
  canDelete: boolean;
  /** `undefined` until the list arrived. */
  data: TokengroupsResponse | undefined;
  /** The group whose deletion is in flight. */
  deletingName: string | undefined;
  isLoading: boolean;
  onDelete: (groupname: string) => void;
}

function toRows(data: TokengroupsResponse | undefined): TokengroupRow[] {
  return Object.entries(data ?? {}).map(([groupname, group]) => ({
    description: group.description ?? "",
    groupname,
    id: group.id
  }));
}

function truncateDescription(description: string): string {
  return description.length > DESCRIPTION_LIMIT
    ? `${description.slice(0, DESCRIPTION_LIMIT)}…`
    : description;
}

/** The table of `config.tokengroup.list.html`: id, name, description and the delete action. */
export function TokengroupTable({
  canDelete,
  data,
  deletingName,
  isLoading,
  onDelete
}: TokengroupTableProps) {
  const { t } = useLingui();

  const columns: DataTableColumn<TokengroupRow>[] = [
    {
      header: t`Id`,
      key: "id",
      render: (row) => row.id,
      width: 80
    },
    {
      header: t`Name`,
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
      header: t`Description`,
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
            header: t`Actions`,
            key: "actions",
            render: (row) => (
              <Button
                color="red"
                leftSection={<IconTrash size={14} />}
                loading={deletingName === row.groupname}
                onClick={() => {
                  onDelete(row.groupname);
                }}
                size="xs"
                variant="light"
              >
                {t`Delete`}
              </Button>
            )
          } satisfies DataTableColumn<TokengroupRow>
        ]
      : [])
  ];

  return (
    <Card flush>
      {isLoading ? <LoadingIndicator label={t`Loading tokengroups`} /> : null}

      <DataTable
        columns={columns}
        data={toRows(data)}
        emptyMessage={t`No tokengroups defined.`}
        getRowKey={(row) => row.groupname}
        id="tabletokengroups"
        isLoading={data === undefined}
        minWidth={480}
      />
    </Card>
  );
}
