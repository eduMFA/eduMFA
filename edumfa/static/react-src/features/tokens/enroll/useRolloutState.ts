import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import { getTokenBySerial, type TokenEnrollDetail } from "@/api/tokens";

/** The legacy controller polled a token in `clientwait` this often. */
const ROLLOUT_POLL_MS = 2500;

/**
 * Port of `pollTokenInfo`: while the enrolled token waits for its client
 * (two-step OTP, push), its record is re-read until the rollout state
 * changes. `attempt` separates consecutive enrollments of the same serial
 * (regenerate, client part) so stale poll results do not leak over.
 */
export function useRolloutState(
  enrolled: TokenEnrollDetail | null,
  attempt: number
): string {
  const apiClient = useApiClient();
  const isWaiting = enrolled?.rollout_state === "clientwait";
  const rolloutQuery = useQuery({
    enabled: isWaiting,
    queryFn: ({ signal }) =>
      getTokenBySerial(apiClient, enrolled?.serial ?? "", signal),
    queryKey: ["token-rollout", enrolled?.serial ?? "", attempt],
    refetchInterval: (query) =>
      query.state.data?.tokens[0]?.rollout_state === "clientwait"
        ? ROLLOUT_POLL_MS
        : false
  });
  const polledState = isWaiting
    ? rolloutQuery.data?.tokens[0]?.rollout_state
    : undefined;

  return polledState ?? enrolled?.rollout_state ?? "";
}
