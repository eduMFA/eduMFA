import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { type TokenFilterName, type TokenFilters } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  disableToken,
  enableToken,
  getTokens,
  resetFailCounter,
  tokenQueryKeys,
  type TokenDetail,
  type TokenListParams
} from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { type DataTableSort } from "@/components/tables/DataTable";
import { toContainsWildcard } from "@/lib/strings";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

/** The backend default (`sortby=serial`), made explicit so the header shows it. */
const defaultSort: DataTableSort = { by: "serial", direction: "asc" };

/**
 * State of the token table. Paging, sorting and filtering stay on the server
 * like in the legacy controller; the inline enable/disable and fail counter
 * reset mutations refresh every token query.
 */
export function useTokenList() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated, settings } = useAuth();
  const filterState = useDebouncedState<TokenFilters>({}, FILTER_DEBOUNCE_MS, {
    liveApply: !settings.searchOnEnter
  });
  const {
    applied: appliedFilters,
    apply: applyFilters,
    draft: draftFilters
  } = filterState;
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort>(defaultSort);

  const params = useMemo<TokenListParams>(
    () => ({
      page,
      pagesize: settings.tokenPageSize,
      sortby: sort.by,
      sortdir: sort.direction,
      ...toTokenParams(appliedFilters)
    }),
    [appliedFilters, page, settings.tokenPageSize, sort]
  );

  const tokensQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getTokens(apiClient, params, signal),
    queryKey: tokenQueryKeys.list(params)
  });

  const invalidateTokens = () =>
    queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
  const toggleActiveMutation = useMutation({
    mutationFn: (token: TokenDetail) =>
      token.active
        ? disableToken(apiClient, token.serial)
        : enableToken(apiClient, token.serial),
    onSuccess: invalidateTokens
  });
  const resetMutation = useMutation({
    mutationFn: (serial: string) => resetFailCounter(apiClient, serial),
    onSuccess: invalidateTokens
  });

  const setDraftFilter = (name: TokenFilterName, value: string) => {
    setPage(1);
    filterState.setDraft((previousFilters) => ({ ...previousFilters, [name]: value }));
  };

  return {
    applyFilters,
    draftFilters,
    page,
    resetMutation,
    setDraftFilter,
    setPage,
    setSort,
    sort,
    toggleActiveMutation,
    tokensQuery
  };
}

/** Builds the filter parameters; empty filters are left out of the request. */
function toTokenParams(filters: TokenFilters): Pick<TokenListParams, TokenFilterName> {
  const requestParams: Pick<TokenListParams, TokenFilterName> = {};

  for (const [name, value] of Object.entries(filters) as [TokenFilterName, string][]) {
    if (value) {
      requestParams[name] = toContainsWildcard(value);
    }
  }

  return requestParams;
}
