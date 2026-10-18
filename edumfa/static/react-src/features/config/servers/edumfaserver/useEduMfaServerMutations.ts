import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  saveEduMfaServer,
  serverQueryKeys,
  testEduMfaServerRequest,
  type EduMfaServerRequest,
  type EduMfaServerTestRequest
} from "@/api/servers";
import { pushFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/**
 * Saving an eduMFA server definition (then back to the list like the
 * legacy `$state.go`) and sending a test request with the current values.
 */
export function useEduMfaServerMutations() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();

  const saveMutation = useMutation({
    mutationFn: (request: EduMfaServerRequest) => saveEduMfaServer(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.eduMfaServers });
      pushFlash(t`eduMFA Server Config saved.`, "info");
      void navigate("/config/edumfaserver/list");
    }
  });

  const testMutation = useMutation({
    mutationFn: (request: EduMfaServerTestRequest) =>
      testEduMfaServerRequest(apiClient, request),
    onSuccess: (accepted) => {
      if (accepted) {
        notify(t`Request to remote eduMFA server successful.`, "success");
      } else {
        notify(
          t`Request to remote eduMFA server not successful. Check the fields URL, username and password for correctness.`,
          "danger"
        );
      }
    }
  });

  return { saveMutation, testMutation };
}
