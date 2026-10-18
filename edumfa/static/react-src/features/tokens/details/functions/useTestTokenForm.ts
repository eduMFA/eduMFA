import { useLingui } from "@lingui/react/macro";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getSystemConfig, isConfigEnabled } from "@/api/config";
import { checkToken } from "@/api/validate";
import { useAuth } from "@/auth/AuthProvider";
import { notify } from "@/lib/notify";

export interface TestTokenFormParams {
  onRefresh: () => Promise<void>;
  serial: string;
}

/** The test authentication through `/validate/check`, with or without the PIN. */
export function useTestTokenForm({ onRefresh, serial }: TestTokenFormParams) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const [password, setPassword] = useState("");

  // The placeholder tells whether the PIN is typed before or after the OTP.
  const systemConfigQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSystemConfig(apiClient, signal),
    queryKey: configQueryKeys.system
  });
  const prependPin = isConfigEnabled(systemConfigQuery.data?.PrependPin);
  const placeholder = prependPin
    ? t`Enter PIN and OTP to check the token.`
    : t`Enter OTP + PIN to check the token.`;

  const mutation = useMutation({
    mutationFn: (otpOnly: boolean) =>
      checkToken(apiClient, {
        pass: password,
        serial,
        ...(otpOnly ? { otponly: "1" } : {})
      }),
    onSuccess: async (result) => {
      await onRefresh();

      if (result.success) {
        notify(t`Successfully authenticated.`, "success");
      } else {
        notify(result.message || t`Authentication failed.`, "danger");
      }
    }
  });

  return { mutation, password, placeholder, setPassword };
}

export type TestTokenForm = ReturnType<typeof useTestTokenForm>;
