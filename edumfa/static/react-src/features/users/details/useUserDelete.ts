import { useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult
} from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { deleteUser, userQueryKeys } from "@/api/users";
import { pushFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

export interface UserDeletion {
  closeDialog: () => void;
  deleteMutation: UseMutationResult<boolean, Error, void>;
  isDialogOpen: boolean;
  openDialog: () => void;
}

/** Deletes the user from its store once the dialog is confirmed. */
export function useUserDelete(resolverName: string, username: string): UserDeletion {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(apiClient, resolverName, username),
    onSettled: () => {
      setIsDialogOpen(false);
    },
    onSuccess: async (deleted) => {
      if (!deleted) {
        notify(t`Failed to delete user.`, "danger");

        return;
      }

      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      pushFlash(t`User deleted successfully.`, "success");
      void navigate("/user/list");
    }
  });

  return {
    closeDialog: () => {
      setIsDialogOpen(false);
    },
    deleteMutation,
    isDialogOpen,
    openDialog: () => {
      setIsDialogOpen(true);
    }
  };
}
