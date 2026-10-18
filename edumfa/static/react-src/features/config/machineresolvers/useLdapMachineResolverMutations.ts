import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  toLdapMachineResolverRequest,
  type LdapMachineResolverFormValues
} from "./ldapMachineResolverValues";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  machineResolverQueryKeys,
  saveMachineResolver,
  testMachineResolver
} from "@/api/machineResolvers";
import { notify } from "@/lib/notify";

/**
 * The save and the connection test of an LDAP machine resolver. Saving
 * refreshes the list and goes back to it like the legacy controller; the
 * test result is shown as a growl.
 */
export function useLdapMachineResolverMutations(storedData: Record<string, unknown>) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: (values: LdapMachineResolverFormValues) =>
      saveMachineResolver(
        apiClient,
        values.resolvername,
        toLdapMachineResolverRequest(values, storedData)
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: machineResolverQueryKeys.all });
      void navigate("/config/machineresolvers/list");
    }
  });
  const testMutation = useMutation({
    mutationFn: (values: LdapMachineResolverFormValues) =>
      testMachineResolver(apiClient, toLdapMachineResolverRequest(values, storedData)),
    onSuccess: (result) => {
      notify(result.description, result.success ? "success" : "danger");
    }
  });

  return { saveMutation, testMutation };
}
