import type { Definition } from "./types";
import type { DataTableSort } from "@/components/tables/DataTable";

function compareDefinitions(a: Definition, b: Definition, by: string): number {
  switch (by) {
    case "ordering":
      return a.ordering - b.ordering;
    case "active":
      return Number(a.active) - Number(b.active);
    default:
      return a.name.localeCompare(b.name);
  }
}

/** Filter on the whole row so type specific columns are searchable too; ties sort by id. */
export function listDefinitionRows<T extends Definition>(
  rows: readonly T[],
  filter: string,
  sort: DataTableSort
): T[] {
  return rows
    .filter((row) => JSON.stringify(row).toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const compare = compareDefinitions(a, b, sort.by);
      return (compare || a.id - b.id) * (sort.direction === "asc" ? 1 : -1);
    });
}
