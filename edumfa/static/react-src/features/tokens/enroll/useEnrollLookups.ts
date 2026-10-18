import { configString, getConfiguredQuestions } from "./enrollForm";
import type { EnrollLookups } from "./fields/types";
import { useTypeLookups } from "./useTypeLookups";
import type { SystemConfig } from "@/api/config";
import { useAuth } from "@/auth/AuthProvider";
import { getRightsValue } from "@/auth/permissions";

export interface UseEnrollLookupsOptions {
  realmNames: readonly string[];
  systemConfig: SystemConfig;
  /** Mobile numbers of the selected user. */
  userPhones: readonly string[];
}

export interface EnrollLookupsResult {
  /** First failed type-specific lookup, if any. */
  error: Error | null;
  lookups: EnrollLookups;
}

/**
 * The lists the type-specific fields choose from: the type's own server
 * lookups plus what the session, the system config and the selected user
 * already provide.
 */
export function useEnrollLookups(
  type: string,
  { realmNames, systemConfig, userPhones }: UseEnrollLookupsOptions
): EnrollLookupsResult {
  const { isAuthenticated, rights } = useAuth();
  const typeLookups = useTypeLookups(type, isAuthenticated);

  return {
    error: typeLookups.error,
    lookups: {
      caConnectors: typeLookups.caConnectors,
      eduMfaServers: typeLookups.eduMfaServers,
      numAnswers: configString(systemConfig, "question.num_answers") ?? "",
      phones: userPhones,
      questions: getConfiguredQuestions(systemConfig),
      radiusNames: typeLookups.radiusNames,
      realms: realmNames,
      serviceIds: typeLookups.serviceIds,
      smsGateways: String(getRightsValue(rights, "sms_gateways", ""))
        .split(" ")
        .filter((gateway) => gateway.length > 0)
    }
  };
}
