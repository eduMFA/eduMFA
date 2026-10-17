import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { pollTransaction } from "@/api/validate";

/** The legacy `PollingAuthFactory` asked every second. */
export const AUTH_POLL_MS = 1000;

export interface PollTransactionOptions {
  enabled: boolean;
  /** Called once; the caller finishes the login with the transaction id. */
  onAnswered: () => void;
  transactionId: string;
}

/**
 * Port of `check_authentication`: while an out-of-band token (push, TiQR)
 * waits for its confirmation, `/validate/polltransaction` is asked every
 * second. A failed poll is retried on the next tick, like the legacy
 * interval did.
 */
export function usePollTransaction({
  enabled,
  onAnswered,
  transactionId
}: PollTransactionOptions): void {
  const apiClient = useApiClient();

  useEffect(() => {
    if (!enabled || !transactionId) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    let inFlight = false;

    const poll = async () => {
      if (inFlight) {
        return;
      }

      inFlight = true;

      try {
        const answered = await pollTransaction(
          apiClient,
          transactionId,
          controller.signal
        );

        if (answered && active) {
          active = false;
          clearInterval(intervalId);
          onAnswered();
        }
      } catch {
        // The endpoint failed or the poll was aborted; the next tick asks again.
      } finally {
        inFlight = false;
      }
    };
    const intervalId = setInterval(() => {
      void poll();
    }, AUTH_POLL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
      controller.abort();
    };
  }, [apiClient, enabled, onAnswered, transactionId]);
}
