import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "../api/envelope";

export function createEduMfaQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && [401, 403].includes(error.status)) {
            return false;
          }

          return failureCount < 2;
        },
        staleTime: 30_000
      }
    }
  });
}
