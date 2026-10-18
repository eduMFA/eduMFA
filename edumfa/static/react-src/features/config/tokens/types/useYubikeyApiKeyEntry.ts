import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import type { TokenConfigUpdate } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { getRandom } from "@/api/system";
import { yubikeyApiKeyPrefix } from "@/features/config/tokens/tokenConfigForm";

/**
 * The pending client id / API key pair: every change re-stages it under the
 * current id, and "Create new API key" fills the key from `GET /system/random`.
 */
export function useYubikeyApiKeyEntry(onChange: (update: TokenConfigUpdate) => void) {
  const apiClient = useApiClient();
  const [apiId, setApiId] = useState("");
  const [apiKey, setApiKey] = useState("");

  /** Re-stages the pending entry under the current id, dropping the previous key. */
  const stageEntry = (nextApiId: string, nextApiKey: string) => {
    const update: TokenConfigUpdate = {};

    if (apiId !== "") {
      update[`${yubikeyApiKeyPrefix}${apiId}`] = null;
    }

    if (nextApiId !== "" && nextApiKey !== "") {
      update[`${yubikeyApiKeyPrefix}${nextApiId}`] = nextApiKey;
    }

    onChange(update);
  };

  const randomKeyMutation = useMutation({
    mutationFn: () => getRandom(apiClient, 20, "b64"),
    onSuccess: (randomKey) => {
      setApiKey(randomKey);
      stageEntry(apiId, randomKey);
    }
  });

  return {
    apiId,
    apiKey,
    changeApiId: (value: string) => {
      setApiId(value);
      stageEntry(value, apiKey);
    },
    changeApiKey: (value: string) => {
      setApiKey(value);
      stageEntry(apiId, value);
    },
    randomKeyMutation
  };
}
