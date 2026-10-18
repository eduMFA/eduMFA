import { useQueries, type UseQueryResult } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  getTokens,
  tokenQueryKeys,
  type TokenListParams,
  type TokenListResponse
} from "@/api/tokens";

export type TokenCountKey =
  "hardware" | "software" | "total" | "unassignedHardware" | "unassignedSoftware";

/** Token counts are read with `pagesize=0`, which skips the user resolving. */
const tokenCountParams: Record<TokenCountKey, TokenListParams> = {
  hardware: { infokey: "tokenkind", infovalue: "hardware", pagesize: 0 },
  software: { infokey: "tokenkind", infovalue: "software", pagesize: 0 },
  total: { pagesize: 0 },
  unassignedHardware: {
    assigned: "False",
    infokey: "tokenkind",
    infovalue: "hardware",
    pagesize: 0
  },
  unassignedSoftware: {
    assigned: "False",
    infokey: "tokenkind",
    infovalue: "software",
    pagesize: 0
  }
};

const tokenCountKeys = Object.keys(tokenCountParams) as TokenCountKey[];

export type TokenCounts = Record<TokenCountKey, number | undefined>;

export interface TokenCountsResult {
  counts: TokenCounts;
  /** The underlying queries, in the order of `TokenCountKey`. */
  queries: UseQueryResult<TokenListResponse>[];
}

/** One count query per token kind, like the legacy dashboard controller. */
export function useTokenCounts(enabled: boolean): TokenCountsResult {
  const apiClient = useApiClient();
  const queries = useQueries({
    queries: tokenCountKeys.map((key) => ({
      enabled,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getTokens(apiClient, tokenCountParams[key], signal),
      queryKey: tokenQueryKeys.list(tokenCountParams[key])
    }))
  });
  const counts = Object.fromEntries(
    tokenCountKeys.map((key, index) => [key, queries[index]?.data?.count])
  ) as TokenCounts;

  return { counts, queries };
}
