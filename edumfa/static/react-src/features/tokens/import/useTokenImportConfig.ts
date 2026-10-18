import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  configQueryKeys,
  getDefaultRealmName,
  getPgpKeys,
  getRealms
} from "@/api/config";
import { useAuth } from "@/auth/AuthProvider";

/** The realms a file can be imported into and the server's PGP keys. */
export function useTokenImportConfig() {
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();

  const realmsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const pgpKeysQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getPgpKeys(apiClient, signal),
    queryKey: configQueryKeys.pgpKeys
  });

  const realmNames = Object.keys(realmsQuery.data ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
  const defaultRealm = realmsQuery.data
    ? (getDefaultRealmName(realmsQuery.data) ?? "")
    : "";

  return { defaultRealm, pgpKeysQuery, realmNames, realmsQuery };
}
