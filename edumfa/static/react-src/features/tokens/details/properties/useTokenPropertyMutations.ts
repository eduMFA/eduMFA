import { useLingui } from "@lingui/react/macro";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { TokenProperties } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms, getTokengroups } from "@/api/config";
import {
  disableToken,
  enableToken,
  resetFailCounter,
  revokeToken,
  setTokenDescription,
  setTokenGroups,
  setTokenProperties,
  setTokenRealms,
  verifyTokenEnrollment,
  type TokenDetail
} from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { notify } from "@/lib/notify";

export interface TokenPropertyMutationsParams {
  onRefresh: () => Promise<void>;
  serial: string;
  token: TokenDetail;
}

/**
 * The lookups and write requests behind the properties table; every write
 * re-reads the token afterwards. The enrollment verification code lives
 * here because the verify request clears it before that refresh.
 */
export function useTokenPropertyMutations({
  onRefresh,
  serial,
  token
}: TokenPropertyMutationsParams) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [verifyCode, setVerifyCode] = useState("");

  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const tokengroupsQuery = useQuery({
    enabled: isAuthenticated && isAdmin && hasRight(rights, "tokengroup_list"),
    queryFn: ({ signal }) => getTokengroups(apiClient, signal),
    queryKey: configQueryKeys.tokengroups
  });

  const setProperties = useMutation({
    mutationFn: (properties: TokenProperties) =>
      setTokenProperties(apiClient, serial, properties),
    onSuccess: onRefresh
  });
  const setDescription = useMutation({
    mutationFn: (description: string) =>
      hasRight(rights, "setdescription")
        ? setTokenDescription(apiClient, serial, description)
        : setTokenProperties(apiClient, serial, { description }),
    onSuccess: onRefresh
  });
  const toggleActive = useMutation({
    mutationFn: () =>
      token.active ? disableToken(apiClient, serial) : enableToken(apiClient, serial),
    onSuccess: onRefresh
  });
  const revoke = useMutation({
    mutationFn: () => revokeToken(apiClient, serial),
    onSuccess: onRefresh
  });
  const reset = useMutation({
    mutationFn: () => resetFailCounter(apiClient, serial),
    onSuccess: onRefresh
  });
  const verify = useMutation({
    mutationFn: () =>
      verifyTokenEnrollment(apiClient, {
        serial,
        type: token.tokentype,
        verify: verifyCode
      }),
    onSuccess: async (verified) => {
      setVerifyCode("");
      notify(
        verified
          ? t`Enrollment successfully verified.`
          : t`Enrollment verification failed.`,
        verified ? "info" : "danger"
      );
      await onRefresh();
    }
  });
  const setRealms = useMutation({
    mutationFn: (realms: string[]) => setTokenRealms(apiClient, serial, realms),
    onSuccess: onRefresh
  });
  const setGroups = useMutation({
    mutationFn: (groups: string[]) => setTokenGroups(apiClient, serial, groups),
    onSuccess: onRefresh
  });

  return {
    realmsQuery,
    reset,
    revoke,
    setDescription,
    setGroups,
    setProperties,
    setRealms,
    setVerifyCode,
    toggleActive,
    tokengroupsQuery,
    verify,
    verifyCode
  };
}

export type TokenPropertyMutations = ReturnType<typeof useTokenPropertyMutations>;
