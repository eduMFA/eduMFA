import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms } from "@/api/config";
import { useAuth } from "@/auth/AuthProvider";

export interface PostLoginDialogState {
  onClose: () => void;
  opened: boolean;
}

export interface PostLoginDialogs {
  /** The welcome dialog of a user without tokens (`dialog_no_token`). */
  noToken: PostLoginDialogState;
  /** The "create default realm" offer for an administrator without realms. */
  realm: PostLoginDialogState;
}

/**
 * The dialogs that follow a login. Each is shown once per session, like the
 * legacy scope flags: closing one remembers the session token it was closed
 * for.
 */
export function usePostLoginDialogs(): PostLoginDialogs {
  const apiClient = useApiClient();
  const { authToken, isAuthenticated, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const [noTokenDismissedFor, setNoTokenDismissedFor] = useState<string | null>(null);
  const [realmDialogDismissedFor, setRealmDialogDismissedFor] = useState<string | null>(
    null
  );

  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const showRealmDialog =
    isAuthenticated &&
    isAdmin &&
    realmsQuery.data !== undefined &&
    Object.keys(realmsQuery.data).length === 0 &&
    realmDialogDismissedFor !== authToken;
  const showNoTokenDialog =
    isAuthenticated &&
    isUser &&
    settings.dialogNoToken &&
    noTokenDismissedFor !== authToken;

  return {
    noToken: {
      onClose: () => {
        setNoTokenDismissedFor(authToken);
      },
      opened: showNoTokenDialog
    },
    realm: {
      onClose: () => {
        setRealmDialogDismissedFor(authToken);
      },
      opened: showRealmDialog
    }
  };
}
