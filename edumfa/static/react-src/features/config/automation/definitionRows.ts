import type { Definition } from "./types";
import type { DataTableSort } from "@/components/tables/DataTable";

/** Filter on the whole row so type specific columns are searchable too; ties sort by id. */
export function listDefinitionRows<T extends Definition>(
  rows: readonly T[],
  filter: string,
  sort: DataTableSort
): T[] {
  return rows
    .filter((row) => JSON.stringify(row).toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const compare =
        sort.by === "ordering"
          ? a.ordering - b.ordering
          : sort.by === "active"
            ? Number(a.active) - Number(b.active)
            : a.name.localeCompare(b.name);
      return (compare || a.id - b.id) * (sort.direction === "asc" ? 1 : -1);
    });
}
