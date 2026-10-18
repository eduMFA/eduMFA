import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { resyncToken } from "@/api/tokens";
import { notify } from "@/lib/notify";

export interface ResyncFormParams {
  onRefresh: () => Promise<void>;
  serial: string;
}

/** Two consecutive OTP values resynchronise the token's counter. */
export function useResyncForm({ onRefresh, serial }: ResyncFormParams) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");

  const mutation = useMutation({
    mutationFn: () => resyncToken(apiClient, { otp1, otp2, serial }),
    onSuccess: async (resynced) => {
      setOtp1("");
      setOtp2("");
      notify(
        resynced ? t`Token resync successful.` : t`Token resync failed.`,
        resynced ? "info" : "danger"
      );
      await onRefresh();
    }
  });

  return { mutation, otp1, otp2, setOtp1, setOtp2 };
}

export type ResyncForm = ReturnType<typeof useResyncForm>;
