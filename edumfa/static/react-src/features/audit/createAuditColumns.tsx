import { AuditFilterInput } from "./AuditFilterInput";
import { auditColumnConfigs } from "./auditColumns";
import type { AuditLog } from "./useAuditLog";
import type { AuditEntry } from "@/api/audit";
import type { DataTableColumn } from "@/components/tables/DataTable";

export type AuditFilterHandlers = Pick<
  AuditLog,
  "applyFilters" | "draftFilters" | "replaceFilters" | "setDraftFilter"
>;

/** The table columns for the keys the backend reports, with their header filters. */
export function createAuditColumns(
  visibleColumns: string[],
  isAdmin: boolean,
  filters: AuditFilterHandlers
): DataTableColumn<AuditEntry>[] {
  return auditColumnConfigs
    .filter(
      (column) => visibleColumns.includes(column.key) && (!column.adminOnly || isAdmin)
    )
    .map((column) => ({
      filter: column.filterName ? (
        <AuditFilterInput
          draftFilters={filters.draftFilters}
          filterName={column.filterName}
          onApply={filters.applyFilters}
          onDraftChange={filters.setDraftFilter}
          onReplace={filters.replaceFilters}
        />
      ) : null,
      header: column.label,
      key: column.key,
      nowrap: column.nowrap,
      render: (entry) => column.render(entry, isAdmin)
    }));
}
