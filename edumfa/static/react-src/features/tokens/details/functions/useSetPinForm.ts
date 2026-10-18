import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { setTokenPin } from "@/api/tokens";
import { notify } from "@/lib/notify";

export interface SetPinFormParams {
  onRefresh: () => Promise<void>;
  serial: string;
  tokentype: string;
}

/** The OTP PIN, typed twice. */
export function useSetPinForm({ onRefresh, serial, tokentype }: SetPinFormParams) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");

  const mutation = useMutation({
    mutationFn: () => setTokenPin(apiClient, serial, "otppin", pin1),
    onSuccess: async (count) => {
      setPin1("");
      setPin2("");
      notify(
        count >= 1 ? t`PIN set successfully.` : t`Failed to set PIN.`,
        count >= 1 ? "info" : "danger"
      );

      // The PKCS12 of a certificate token is encrypted with the new PIN.
      if (tokentype === "certificate") {
        await onRefresh();
      }
    }
  });

  return { mutation, pin1, pin2, setPin1, setPin2 };
}

export type SetPinForm = ReturnType<typeof useSetPinForm>;
