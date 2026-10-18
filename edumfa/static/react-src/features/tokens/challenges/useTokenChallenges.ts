import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  getTokenChallenges,
  tokenQueryKeys,
  type TokenChallengeListParams
} from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { type DataTableSort } from "@/components/tables/DataTable";
import { toContainsWildcard } from "@/lib/strings";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Fixed in the legacy template (`items-per-page="15"`), not policy driven. */
export const CHALLENGE_PAGE_SIZE = 15;

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

/** The backend default (`sortby=timestamp`), made explicit so the header shows it. */
const defaultSort: DataTableSort = { by: "timestamp", direction: "asc" };

/**
 * The open challenge-response transactions, paginated and sorted on the
 * server. The serial filter is sent as the path segment of
 * `GET /token/challenges/<serial>` like the legacy controller did.
 */
export function useTokenChallenges() {
  const apiClient = useApiClient();
  const { isAuthenticated, settings } = useAuth();
  const serialFilter = useDebouncedState("", FILTER_DEBOUNCE_MS, {
    liveApply: !settings.searchOnEnter
  });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort>(defaultSort);

  const serialPattern = serialFilter.applied
    ? toContainsWildcard(serialFilter.applied)
    : null;
  const params = useMemo<TokenChallengeListParams>(
    () => ({
      page,
      pagesize: CHALLENGE_PAGE_SIZE,
      sortby: sort.by,
      sortdir: sort.direction
    }),
    [page, sort]
  );

  const challengesQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      getTokenChallenges(apiClient, serialPattern, params, signal),
    queryKey: tokenQueryKeys.challenges(serialPattern, params)
  });

  const setSerialDraft = (value: string) => {
    setPage(1);
    serialFilter.setDraft(value);
  };

  return {
    challengesQuery,
    page,
    serialFilter,
    setPage,
    setSerialDraft,
    setSort,
    sort
  };
}
