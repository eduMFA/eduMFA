import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import { authQueryKeys, getAuthRights } from "@/api/auth";
import {
  configQueryKeys,
  getDefaultRealmName,
  getRealms,
  getSystemConfig,
  type SystemConfig
} from "@/api/config";
import { useAuth } from "@/auth/AuthProvider";

export interface EnrollDefaults {
  defaultRealm: string;
  defaultTokenType: string;
  /** The `default_tokentype` policy names a type the session may not enroll. */
  defaultTypeFallback: boolean;
  /** Enrollable token types with their descriptions (`GET /auth/rights`). */
  enrollTypes: Record<string, string>;
  /** Failed lookups in display order: enroll types, realms. */
  errors: (Error | null)[];
  realmNames: string[];
  systemConfig: SystemConfig;
  typeNames: string[];
}

export interface UseEnrollDefaultsOptions {
  isAdmin: boolean;
  isRollover: boolean;
  /** `:tokenType` of the rollover route. */
  rolloverType: string;
  /** `:realm` of the enroll route, which overrides the default realm. */
  routeRealm: string;
}

/**
 * The server-side defaults of the form: the enrollable types, the realms an
 * admin may assign to and the system config the type presets come from.
 */
export function useEnrollDefaults({
  isAdmin,
  isRollover,
  rolloverType,
  routeRealm
}: UseEnrollDefaultsOptions): EnrollDefaults {
  const apiClient = useApiClient();
  const { isAuthenticated, settings } = useAuth();
  const enrollTypesQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getAuthRights(apiClient, signal),
    queryKey: authQueryKeys.rights
  });
  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const systemConfigQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSystemConfig(apiClient, signal),
    queryKey: configQueryKeys.system
  });

  const enrollTypes = enrollTypesQuery.data ?? {};
  const typeNames = Object.keys(enrollTypes);
  const defaultTypeAllowed = typeNames.includes(settings.defaultTokenType);
  let defaultTokenType = typeNames[0] ?? settings.defaultTokenType;
  if (isRollover) {
    defaultTokenType = rolloverType;
  } else if (defaultTypeAllowed) {
    defaultTokenType = settings.defaultTokenType;
  }
  // "hotp" is also the value when no default_tokentype policy exists, so a
  // missing enrollHOTP right is not worth a warning (legacy behaviour).
  const defaultTypeFallback =
    !isRollover &&
    typeNames.length > 0 &&
    !defaultTypeAllowed &&
    settings.defaultTokenType !== "hotp";

  const realmNames = Object.keys(realmsQuery.data ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
  const defaultRealm =
    routeRealm ||
    (realmsQuery.data ? (getDefaultRealmName(realmsQuery.data) ?? "") : "");

  return {
    defaultRealm,
    defaultTokenType,
    defaultTypeFallback,
    enrollTypes,
    errors: [enrollTypesQuery.error, realmsQuery.error],
    realmNames,
    systemConfig: systemConfigQuery.data ?? {},
    typeNames
  };
}
