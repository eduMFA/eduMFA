import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import type { ExistingTokengroup, TokengroupFormValues } from "./tokengroupValues";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  saveTokengroup,
  tokengroupQueryKeys,
  type TokengroupWriteRequest
} from "@/api/tokengroups";
import { pushFlash } from "@/lib/flash";

/**
 * `POST /tokengroup/`: keeps the id of an existing group, then leaves the
 * "saved" notice for the list page and opens it.
 */
export function useSaveTokengroup(existing: ExistingTokengroup | null) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();

  return useMutation({
    mutationFn: (values: TokengroupFormValues) => {
      const request: TokengroupWriteRequest = {
        description: values.description,
        groupname: values.groupname
      };

      if (existing?.group.id !== undefined) {
        request.id = existing.group.id;
      }

      return saveTokengroup(apiClient, request);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokengroupQueryKeys.all });
      pushFlash(t`Tokengroup saved.`, "info");
      void navigate("/config/tokengroup/list");
    }
  });
}
