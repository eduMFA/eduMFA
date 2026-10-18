import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  buildTokenConfigRequest,
  isTokenConfigValid,
  readTokenConfigForm,
  type TokenConfigEdits,
  type TokenConfigTypeKey
} from "./tokenConfigForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, type SystemConfig } from "@/api/config";
import {
  deleteSystemConfig,
  saveSystemConfig,
  type SystemConfigRequest
} from "@/api/system";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import type { TokenConfigUpdate } from "@/features/config/tokens/types/types";
import { notify } from "@/lib/notify";

/** Staged edits of one token type's settings with the save and delete mutations. */
export function useTokenConfigForm(
  config: SystemConfig,
  tokenType: TokenConfigTypeKey
) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "configwrite");
  const canDelete = hasRight(rights, "configdelete");
  const [edits, setEdits] = useState<TokenConfigEdits>({});
  const [revision, setRevision] = useState(0);
  const base = readTokenConfigForm(config);
  const form = { ...base, ...edits };
  const request = buildTokenConfigRequest(base, edits);
  const valid = isTokenConfigValid(tokenType, form, edits);
  const saveMutation = useMutation({
    mutationFn: (payload: SystemConfigRequest) => saveSystemConfig(apiClient, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: configQueryKeys.system });
      setEdits({});
      setRevision((previous) => previous + 1);
      notify(t`Token configuration saved.`, "success");
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteSystemConfig(apiClient, key),
    onSuccess: async (_result, key) => {
      await queryClient.invalidateQueries({ queryKey: configQueryKeys.system });
      setEdits((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(([entryKey]) => entryKey !== key)
        )
      );
    }
  });
  const busy = saveMutation.isPending || deleteMutation.isPending;
  const save = () => {
    if (canWrite && valid && !busy && Object.keys(request).length)
      saveMutation.mutate(request);
  };
  const update = (changes: TokenConfigUpdate) => {
    setEdits((previous) => {
      return Object.fromEntries(
        Object.entries({ ...previous, ...changes }).filter(
          (entry): entry is [string, string | boolean] => entry[1] !== null
        )
      );
    });
  };

  return {
    busy,
    canDelete,
    canWrite,
    deleteMutation,
    form,
    request,
    revision,
    save,
    saveMutation,
    update,
    valid
  };
}
