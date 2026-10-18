import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  getTokens,
  tokenQueryKeys,
  type TokenListParams,
  type TokenListResponse
} from "@/api/tokens";

/** The legacy details view listed five tokens per page. */
export const USER_TOKEN_PAGE_SIZE = 5;

export interface UserTokens {
  page: number;
  query: UseQueryResult<TokenListResponse>;
  setPage: Dispatch<SetStateAction<number>>;
}

/** The user's tokens, paginated on the server like the legacy view. */
export function useUserTokens(
  realm: string,
  username: string,
  enabled: boolean
): UserTokens {
  const apiClient = useApiClient();
  const [page, setPage] = useState(1);
  const tokenParams = useMemo<TokenListParams>(
    () => ({
      page,
      pagesize: USER_TOKEN_PAGE_SIZE,
      realm,
      user: username
    }),
    [page, realm, username]
  );
  const query = useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getTokens(apiClient, tokenParams, signal),
    queryKey: tokenQueryKeys.list(tokenParams)
  });

  return { page, query, setPage };
}
