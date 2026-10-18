import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import type { ExistingServiceId, ServiceIdFormValues } from "./serviceIdValues";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  saveServiceId,
  serviceIdQueryKeys,
  type ServiceIdWriteRequest
} from "@/api/serviceIds";
import { pushFlash } from "@/lib/flash";

/**
 * `POST /serviceid/`: keeps the id of an existing definition, then leaves
 * the "saved" notice for the list page and opens it.
 */
export function useSaveServiceId(existing: ExistingServiceId | null) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();

  return useMutation({
    mutationFn: (values: ServiceIdFormValues) => {
      const request: ServiceIdWriteRequest = {
        description: values.description,
        servicename: values.servicename
      };

      if (existing?.service.id !== undefined) {
        request.id = existing.service.id;
      }

      return saveServiceId(apiClient, request);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceIdQueryKeys.all });
      pushFlash(t`Service ID saved.`, "info");
      void navigate("/config/serviceid/list");
    }
  });
}
