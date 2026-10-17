import type { QueryClient, QueryFunction, QueryKey } from "@tanstack/react-query";

/**
 * Starts a query without subscribing to it, so a page can request the data
 * its child components read before they mount. Fresh data in the cache is
 * reused. A failure is not reported here; the component that observes the
 * query later retries and shows the error.
 */
export function prefetchQuery<TData, TKey extends QueryKey>(
  queryClient: QueryClient,
  queryKey: TKey,
  queryFn: QueryFunction<TData, TKey>
): void {
  void queryClient.query({ queryFn, queryKey }).catch(() => undefined);
}
