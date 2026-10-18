import { useLingui } from "@lingui/react/macro";

import {
  getBaseTokenColumns,
  getTokenOwnerColumns,
  getTokenUserDetailColumns
} from "./tokenListColumns";
import { type TokenFilterName, type TokenFilters } from "./types";
import { type TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import { type DataTableColumn } from "@/components/tables/DataTable";

export interface TokenListColumnOptions {
  draftFilters: TokenFilters;
  onFilterChange: (name: TokenFilterName, value: string) => void;
  onFilterSubmit: () => void;
  onReset: (serial: string) => void;
  onToggleActive: (token: TokenDetail) => void;
}

/**
 * The token table columns: administrators also see the owner columns, and
 * the `user_details` WebUI policy adds the resolver-level user columns.
 */
export function useTokenListColumns({
  draftFilters,
  onFilterChange,
  onFilterSubmit,
  onReset,
  onToggleActive
}: TokenListColumnOptions): DataTableColumn<TokenDetail>[] {
  const { t } = useLingui();
  const { rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const filterLabels: Record<TokenFilterName, string> = {
    description: t`description`,
    rollout_state: t`rollout state`,
    serial: t`serial`,
    tokenrealm: t`Token realms`,
    type: t`type`
  };

  const filterFor = (name: TokenFilterName) => (
    <ColumnFilter
      label={filterLabels[name]}
      onChange={(value) => {
        onFilterChange(name, value);
      }}
      onSubmit={onFilterSubmit}
      value={draftFilters[name] ?? ""}
    />
  );

  const columns = getBaseTokenColumns({
    canReset: hasRight(rights, "reset"),
    filterFor,
    onReset,
    onToggleActive,
    rights
  });

  if (isAdmin) {
    columns.push(...getTokenOwnerColumns(filterFor));
  }

  // The `user_details` WebUI policy adds the resolver-level user columns.
  if (isAdmin && settings.userDetailsInTokenList) {
    columns.push(...getTokenUserDetailColumns());
  }

  return columns;
}
