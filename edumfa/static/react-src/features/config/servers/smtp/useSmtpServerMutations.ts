import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  saveSmtpServer,
  sendTestEmail,
  serverQueryKeys,
  type SmtpServerRequest,
  type SmtpTestEmailRequest
} from "@/api/servers";
import { pushFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/**
 * Saving an SMTP definition (then back to the list like the legacy
 * `$state.go`) and sending a test email with the current values.
 */
export function useSmtpServerMutations() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();

  const saveMutation = useMutation({
    mutationFn: (request: SmtpServerRequest) => saveSmtpServer(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.smtpServers });
      pushFlash(t`SMTP Config saved.`, "info");
      void navigate("/config/smtp/list");
    }
  });

  const testMutation = useMutation({
    mutationFn: (request: SmtpTestEmailRequest) => sendTestEmail(apiClient, request),
    onSuccess: (delivered) => {
      if (delivered) {
        notify(t`Test Email sent successfully.`, "info");
      }
    }
  });

  return { saveMutation, testMutation };
}
