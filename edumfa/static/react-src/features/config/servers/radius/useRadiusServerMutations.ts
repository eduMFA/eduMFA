import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  saveRadiusServer,
  serverQueryKeys,
  testRadiusRequest,
  type RadiusServerRequest,
  type RadiusTestRequest
} from "@/api/servers";
import { pushFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/**
 * Saving a RADIUS definition (then back to the list like the legacy
 * `$state.go`) and sending a test request with the current values.
 */
export function useRadiusServerMutations() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();

  const saveMutation = useMutation({
    mutationFn: (request: RadiusServerRequest) => saveRadiusServer(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.radiusServers });
      pushFlash(t`RADIUS Config saved.`, "info");
      void navigate("/config/radius/list");
    }
  });

  const testMutation = useMutation({
    mutationFn: (request: RadiusTestRequest) => testRadiusRequest(apiClient, request),
    onSuccess: (accepted) => {
      if (accepted) {
        notify(t`RADIUS request successful.`, "success");
      } else {
        notify(t`RADIUS request failed!`, "danger");
      }
    }
  });

  return { saveMutation, testMutation };
}
