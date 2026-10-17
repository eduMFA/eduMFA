import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useAuth } from "@/auth/AuthProvider";

/**
 * Drops the cached server data when the session ends (logout, idle logout,
 * authentication error). Query keys carry no user, so without this the next
 * login on the same page would see the lists of the previous user until
 * they refetch. A lock keeps the user and therefore the cache.
 */
export function SessionCacheReset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hadUser = useRef(user !== null);

  useEffect(() => {
    if (user === null && hadUser.current) {
      // The pages behind the login are unmounted by now, so their queries
      // have no observers and can go. The few shared ones (navigation,
      // registration status) are reset and start over.
      queryClient.removeQueries({
        predicate: (query) => query.getObserversCount() === 0
      });
      void queryClient.resetQueries();
    }

    hadUser.current = user !== null;
  }, [queryClient, user]);

  return null;
}
