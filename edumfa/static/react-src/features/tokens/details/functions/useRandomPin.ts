import { useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { setRandomPin } from "@/api/tokens";
import { notify } from "@/lib/notify";

/** Lets the server pick a PIN; the generated PIN is shown once. */
export function useRandomPin(serial: string) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const [pin, setPin] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => setRandomPin(apiClient, serial),
    onSuccess: (result) => {
      notify(
        result.value >= 1 ? t`PIN set successfully.` : t`Failed to set PIN.`,
        result.value >= 1 ? "info" : "danger"
      );
      setPin(result.pin);
    }
  });

  return { mutation, pin };
}

export type RandomPin = ReturnType<typeof useRandomPin>;
