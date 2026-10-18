import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { unassignToken } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { pushFlash } from "@/lib/flash";

export interface UnassignTokenParams {
  onRefresh: () => Promise<void>;
  serial: string;
}

/**
 * Unassigns the token. A user who unassigns their own token is sent back
 * to the list like the legacy controller did; an admin sees the refreshed
 * token.
 */
export function useUnassignToken({ onRefresh, serial }: UnassignTokenParams) {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { user } = useAuth();
  const isUser = user?.role === "user";

  return useMutation({
    mutationFn: () => unassignToken(apiClient, serial),
    onSuccess: async () => {
      if (isUser) {
        pushFlash(t`Token unassigned.`, "success");
        void navigate("/token/list");

        return;
      }

      await onRefresh();
    }
  });
}
