import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  configQueryKeys,
  getCaConnectorNames,
  getEduMfaServers,
  getRadiusNames,
  getServiceIds,
  type CaConnectorName,
  type EduMfaServers,
  type ServiceIds
} from "@/api/config";

export interface TypeLookups {
  caConnectors: CaConnectorName[];
  eduMfaServers: EduMfaServers;
  /** First failed lookup, if any. */
  error: Error | null;
  radiusNames: string[];
  serviceIds: ServiceIds;
}

/**
 * Lists that only one token type needs. The rights behind them
 * (`enrollRADIUS`, `enrollCERTIFICATE`, ...) are type-specific as well, so
 * each list is fetched only while its type is selected, like the legacy
 * `changeTokenType` did.
 */
export function useTypeLookups(type: string, enabled: boolean): TypeLookups {
  const apiClient = useApiClient();
  const serviceIdsQuery = useQuery({
    enabled: enabled && type === "applspec",
    queryFn: ({ signal }) => getServiceIds(apiClient, signal),
    queryKey: configQueryKeys.serviceIds
  });
  const radiusNamesQuery = useQuery({
    enabled: enabled && type === "radius",
    queryFn: ({ signal }) => getRadiusNames(apiClient, signal),
    queryKey: configQueryKeys.radiusNames
  });
  const eduMfaServersQuery = useQuery({
    enabled: enabled && type === "remote",
    queryFn: ({ signal }) => getEduMfaServers(apiClient, signal),
    queryKey: configQueryKeys.eduMfaServers
  });
  const caConnectorsQuery = useQuery({
    enabled: enabled && type === "certificate",
    queryFn: ({ signal }) => getCaConnectorNames(apiClient, signal),
    queryKey: configQueryKeys.caConnectorNames
  });

  return {
    caConnectors: caConnectorsQuery.data ?? [],
    eduMfaServers: eduMfaServersQuery.data ?? {},
    error:
      serviceIdsQuery.error ??
      radiusNamesQuery.error ??
      eduMfaServersQuery.error ??
      caConnectorsQuery.error,
    radiusNames: radiusNamesQuery.data ?? [],
    serviceIds: serviceIdsQuery.data ?? {}
  };
}
