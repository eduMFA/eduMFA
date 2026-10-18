import { Table } from "@mantine/core";
import type { ReactNode } from "react";

import { EmptyState } from "./EmptyState";
import { HeaderCell } from "./HeaderCell";

export type SortDirection = "asc" | "desc";

export interface DataTableSort {
  by: string;
  direction: SortDirection;
}

export interface DataTableColumn<TRow> {
  align?: "center" | "left" | "right";
  /** Optional control rendered under the column label in the header cell. */
  filter?: ReactNode;
  header: ReactNode;
  key: string;
  /** Keeps the cell on one line, e.g. for timestamps. */
  nowrap?: boolean | undefined;
  render: (row: TRow) => ReactNode;
  /**
   * Server-side sort key (`sortby`). Together with `onSortChange` on the
   * table it turns the header label into a sort toggle.
   */
  sortKey?: string | undefined;
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
  onSortChange?: ((sort: DataTableSort) => void) | undefined;
  sort?: DataTableSort | null | undefined;
}

/**
 * Sort after a header click, replacing the legacy `pi-sort-by` directive:
 * the same column flips its direction, a new column starts ascending.
 */
export function toggleSort(
  current: DataTableSort | null | undefined,
  sortKey: string
): DataTableSort {
  if (current?.by === sortKey) {
    return { by: sortKey, direction: current.direction === "asc" ? "desc" : "asc" };
  }

  return { by: sortKey, direction: "asc" };
}

/**
 * Column-configured table for the list views. Pagination, sorting and
 * filtering happen on the server, so this only renders what it is given.
 *
 * Column filters live in the same header cell as the label, so the header
 * reads as one band instead of a label row stacked on an input row. Labels
 * never wrap: a wrapped label would push its filter input below the others.
 */
export function DataTable<TRow>({
  columns,
  data,
  emptyMessage,
  getRowKey,
  id,
  isLoading = false,
  minWidth = 640,
  onSortChange,
  sort
}: DataTableProps<TRow>) {
  const hasFilters = columns.some(
    (column) => column.filter !== undefined && column.filter !== null
  );
  const sortBy = onSortChange
    ? (sortKey: string) => {
        onSortChange(toggleSort(sort, sortKey));
      }
    : undefined;

  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table highlightOnHover id={id} verticalSpacing="sm">
        <Table.Thead bg="var(--mantine-color-gray-0)">
          <Table.Tr>
            {columns.map((column) => (
              <HeaderCell
                column={column}
                hasFilters={hasFilters}
                key={column.key}
                onSort={sortBy}
                sort={sort}
              />
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
