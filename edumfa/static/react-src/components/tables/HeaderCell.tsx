import { Stack, Table, Text, UnstyledButton } from "@mantine/core";

import type { DataTableColumn, DataTableSort, SortDirection } from "./DataTable";
import { SortIcon } from "./SortIcon";

export interface HeaderCellProps<TRow> {
  column: DataTableColumn<TRow>;
  hasFilters: boolean;
  /** Sorts by the column's `sortKey`; absent when the table is not sortable. */
  onSort: ((sortKey: string) => void) | undefined;
  sort: DataTableSort | null | undefined;
}

/** The `aria-sort` value for the column's active sort direction. */
function toAriaSort(
  direction: SortDirection | null
): "ascending" | "descending" | undefined {
  switch (direction) {
    case null:
      return undefined;
    case "asc":
      return "ascending";
    default:
      return "descending";
  }
}

/**
 * One header cell of the `DataTable`: the uppercase label, which becomes a
 * sort toggle when the column has a `sortKey`, and the column filter below.
 */
export function HeaderCell<TRow>({
  column,
  hasFilters,
  onSort,
  sort
}: HeaderCellProps<TRow>) {
  const { sortKey } = column;
  const activeDirection =
    sortKey !== undefined && sort?.by === sortKey ? sort.direction : null;
  const label = (
    <Text
      c="dimmed"
      component="span"
      fw={600}
      fz="xs"
      lh={1.3}
      style={{ letterSpacing: "0.04em", whiteSpace: "nowrap" }}
      tt="uppercase"
    >
      {column.header}
    </Text>
  );

  return (
    <Table.Th
      aria-sort={toAriaSort(activeDirection)}
      fw={400}
      py="sm"
      style={{
        textAlign: column.align ?? "left",
        verticalAlign: hasFilters ? "top" : "middle",
        width: column.width
      }}
    >
      <Stack gap={6}>
        {sortKey !== undefined && onSort ? (
          <UnstyledButton
            onClick={() => {
              onSort(sortKey);
            }}
            style={{
              alignItems: "center",
              display: "inline-flex",
              gap: 4,
              whiteSpace: "nowrap"
            }}
            type="button"
          >
            {label}
            <SortIcon direction={activeDirection} />
          </UnstyledButton>
        ) : (
          label
        )}
        {hasFilters && column.filter ? column.filter : null}
      </Stack>
    </Table.Th>
  );
}
