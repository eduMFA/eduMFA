import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { deleteToken, tokenQueryKeys, type TokenDetail } from "@/api/tokens";
import { pushFlash } from "@/lib/flash";

export interface DeleteTokenParams {
  serial: string;
  token: TokenDetail | null;
}

/**
 * Deleting the token. Hardware tokens are asked about first (the legacy
 * `dialogTokenDelete`); afterwards the page returns to the token list
 * because the legacy "previous state" is not known to React.
 */
export function useDeleteToken({ serial, token }: DeleteTokenParams) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => deleteToken(apiClient, serial),
    onSettled: () => {
      setIsDialogOpen(false);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
      pushFlash(t`Token ${serial} deleted.`, "success");
      void navigate("/token/list");
    }
  });

  const requestDelete = () => {
    // Hardware tokens are asked about; software tokens go straight away.
    if (token?.info.tokenkind === "hardware") {
      setIsDialogOpen(true);
    } else {
      mutation.mutate();
    }
  };
  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return { closeDialog, isDialogOpen, mutation, requestDelete };
}
