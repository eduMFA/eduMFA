import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { saveSmsGateway, serverQueryKeys, type SmsGatewayRequest } from "@/api/servers";

/** `POST /smsgateway`, then back to the list like the legacy `$state.go`. */
export function useSaveSmsGateway() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (request: SmsGatewayRequest) => saveSmsGateway(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.smsGateways });
      void navigate("/config/smsgateway/list");
    }
  });
}
