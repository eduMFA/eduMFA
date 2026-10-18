import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  type ApplicationFilterName,
  type ApplicationFilters,
  type ApplicationName
} from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  getMachineTokens,
  machineQueryKeys,
  type MachineTokenParams
} from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";
import { type DataTableSort } from "@/components/tables/DataTable";
import { toContainsWildcard } from "@/lib/strings";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Fixed in the legacy templates (`items-per-page="15"`). */
export const PAGE_SIZE = 15;

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

const defaultSort: DataTableSort = { by: "serial", direction: "asc" };

/**
 * The tokens attached to one application. Filters and sorting go to
 * `GET /machine/token`, paging stays client-side because the endpoint
 * returns the whole list.
 */
export function useMachineTokenList(application: ApplicationName) {
  const apiClient = useApiClient();
  const { isAuthenticated, settings } = useAuth();
  const filterState = useDebouncedState<ApplicationFilters>({}, FILTER_DEBOUNCE_MS, {
    liveApply: !settings.searchOnEnter
  });
  const {
    applied: appliedFilters,
    apply: applyFilters,
    draft: draftFilters
  } = filterState;
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort>(defaultSort);

  const params = useMemo<MachineTokenParams>(() => {
    const requestParams: MachineTokenParams = {
      application,
      sortby: sort.by,
      sortdir: sort.direction
    };

    for (const [name, value] of Object.entries(appliedFilters) as [
      ApplicationFilterName,
      string
    ][]) {
      if (value) {
        requestParams[name] = toContainsWildcard(value);
      }
    }

    return requestParams;
  }, [application, appliedFilters, sort]);

  const tokensQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachineTokens(apiClient, params, signal),
    queryKey: machineQueryKeys.tokens(params)
  });

  const assignments = tokensQuery.data ?? [];
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleAssignments = assignments.slice(pageStart, pageStart + PAGE_SIZE);

  const setDraftFilter = (name: ApplicationFilterName, value: string) => {
    setPage(1);
    filterState.setDraft((previous) => ({ ...previous, [name]: value }));
  };

  return {
    applyFilters,
    assignments,
    draftFilters,
    page,
    setDraftFilter,
    setPage,
    setSort,
    sort,
    tokensQuery,
    visibleAssignments
  };
}
