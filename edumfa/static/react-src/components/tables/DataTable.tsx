import { Stack, Table, Text } from "@mantine/core";
import type { ReactNode } from "react";

import { EmptyState } from "./EmptyState";

export interface DataTableColumn<TRow> {
  align?: "center" | "left" | "right";
  /** Optional control rendered under the column label in the header cell. */
  filter?: ReactNode;
  header: ReactNode;
  key: string;
  /** Keeps the cell on one line, e.g. for timestamps. */
  nowrap?: boolean | undefined;
  render: (row: TRow) => ReactNode;
  width?: number | string;
}

export interface DataTableProps<TRow> {
  columns: readonly DataTableColumn<TRow>[];
  data: readonly TRow[];
  emptyMessage: ReactNode;
  getRowKey: (row: TRow, index: number) => string;
  id?: string;
  /** Keeps the previous rows visible while a refetch is in flight. */
  isLoading?: boolean;
  minWidth?: number;
}

/**
 * Column-configured table for the list views. Pagination, sorting and
 * filtering happen on the server, so this only renders what it is given.
 *
 * Column filters live in the same header cell as the label, so the header
 * reads as one band instead of a label row stacked on an input row.
 */
export function DataTable<TRow>({
  columns,
  data,
  emptyMessage,
  getRowKey,
  id,
  isLoading = false,
  minWidth = 640
}: DataTableProps<TRow>) {
  const hasFilters = columns.some(
    (column) => column.filter !== undefined && column.filter !== null
  );

  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table highlightOnHover id={id} verticalSpacing="sm">
        <Table.Thead bg="var(--mantine-color-gray-0)">
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th
                fw={400}
                key={column.key}
                py="sm"
                style={{
                  textAlign: column.align ?? "left",
                  verticalAlign: hasFilters ? "top" : "middle",
                  width: column.width
                }}
              >
                <Stack gap={6}>
                  <Text
                    c="dimmed"
                    component="span"
                    fw={600}
                    fz="xs"
                    lh={1.3}
                    style={{ letterSpacing: "0.04em" }}
                    tt="uppercase"
                  >
                    {column.header}
                  </Text>
                  {hasFilters && column.filter ? column.filter : null}
                </Stack>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.length === 0 && !isLoading ? (
            <EmptyState colSpan={columns.length} message={emptyMessage} />
          ) : (
            data.map((row, index) => (
              <Table.Tr key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <Table.Td
                    key={column.key}
                    style={{
                      textAlign: column.align ?? "left",
                      whiteSpace: column.nowrap ? "nowrap" : undefined
                    }}
                  >
                    {column.render(row)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
