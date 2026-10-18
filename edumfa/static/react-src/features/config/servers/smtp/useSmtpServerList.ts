import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { deleteSmtpServer, getSmtpServers, serverQueryKeys } from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { popFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

/** The SMTP server list and its delete action; shows the notice the edit page left. */
export function useSmtpServerList() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // The edit page leaves its "saved" notice for this page.
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const serversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSmtpServers(apiClient, signal),
    queryKey: serverQueryKeys.smtpServers
  });

  const deleteMutation = useMutation({
    mutationFn: (identifier: string) => deleteSmtpServer(apiClient, identifier),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.smtpServers });
    }
  });

  return { deleteMutation, serversQuery };
}
