import {
  keepPreviousData,
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult
} from "@tanstack/react-query";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";

import {
  readInitialFilters,
  toAuditParams,
  type AuditFilterName,
  type AuditFilters
} from "./auditFilters";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  auditQueryKeys,
  downloadAuditLog,
  getAuditLog,
  type AuditLogPage,
  type AuditLogParams
} from "@/api/audit";
import { useAuth } from "@/auth/AuthProvider";
import { saveTextAsFile } from "@/lib/download";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

export interface AuditLog {
  appliedFilters: AuditFilters;
  /** Applies the draft filters now, e.g. on Enter. */
  applyFilters: () => void;
  auditQuery: UseQueryResult<AuditLogPage>;
  downloadMutation: UseMutationResult<string, Error, void>;
  draftFilters: AuditFilters;
  page: number;
  pageSize: number;
  /** Applies a complete filter set at once and returns to the first page. */
  replaceFilters: (nextFilters: AuditFilters) => void;
  setDraftFilter: (name: AuditFilterName, value: string) => void;
  setPage: Dispatch<SetStateAction<number>>;
}

/** The filter state, the paginated audit query and the CSV download. */
export function useAuditLog(): AuditLog {
  const apiClient = useApiClient();
  const { isAuthenticated, settings } = useAuth();
  // The legacy audit state accepted ?serial and ?user to open the log
  // pre-filtered from the token and user detail views.
  const [searchParams] = useSearchParams();
  const filterState = useDebouncedState<AuditFilters>(
    () => readInitialFilters(searchParams),
    FILTER_DEBOUNCE_MS,
    { liveApply: !settings.searchOnEnter }
  );
  const {
    applied: appliedFilters,
    apply: applyFilters,
    draft: draftFilters
  } = filterState;
  const [page, setPage] = useState(1);

  const params = useMemo<AuditLogParams>(
    () => ({
      page,
      page_size: settings.auditPageSize,
      sortorder: "desc",
      ...toAuditParams(appliedFilters)
    }),
    [appliedFilters, page, settings.auditPageSize]
  );

  const auditQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getAuditLog(apiClient, params, signal),
    queryKey: auditQueryKeys.log(params)
  });

  const downloadMutation = useMutation({
    mutationFn: () => downloadAuditLog(apiClient, toAuditParams(appliedFilters)),
    onSuccess: (csv) => {
      saveTextAsFile(csv, "audit.csv", "text/csv;charset=utf-8");
    }
  });

  return {
    appliedFilters,
    applyFilters,
    auditQuery,
    downloadMutation,
    draftFilters,
    page,
    pageSize: settings.auditPageSize,
    replaceFilters: (nextFilters) => {
      setPage(1);
      applyFilters(nextFilters);
    },
    setDraftFilter: (name, value) => {
      setPage(1);
      filterState.setDraft((previousFilters) => ({
        ...previousFilters,
        [name]: value
      }));
    },
    setPage
  };
}
