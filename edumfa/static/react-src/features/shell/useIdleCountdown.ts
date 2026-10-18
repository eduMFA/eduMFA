import { useCallback } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { useIdleWatch } from "@/auth/useIdleWatch";

/**
 * The idle watch of the session: after `logout_time` the session is locked
 * or ended per `timeout_action`. Returns the remaining seconds while the
 * warning countdown runs, `null` otherwise.
 */
export function useIdleCountdown(): number | null {
  const { isAuthenticated, isLocked, lock, logout, settings } = useAuth();

  const handleIdleTimeout = useCallback(() => {
    if (settings.timeoutAction === "logout") {
      logout();
    } else {
      lock();
    }
  }, [lock, logout, settings.timeoutAction]);

  return useIdleWatch({
    enabled: isAuthenticated && !isLocked,
    idleSeconds: Math.max(settings.logoutTime - 10, 1),
    onTimeout: handleIdleTimeout
  });
}
