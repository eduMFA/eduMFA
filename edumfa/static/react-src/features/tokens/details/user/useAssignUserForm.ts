import { useLingui } from "@lingui/react/macro";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getDefaultRealmName, getRealms } from "@/api/config";
import { assignToken } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { notify } from "@/lib/notify";
import { fixUser } from "@/lib/users";

export interface AssignUserFormParams {
  onRefresh: () => Promise<void>;
  serial: string;
}

/**
 * The assign form: realm (admins only; the default realm is preselected),
 * user and the PIN typed twice. The form is cleared once the token is
 * assigned.
 */
export function useAssignUserForm({ onRefresh, serial }: AssignUserFormParams) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedRealm, setSelectedRealm] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinRepeat, setPinRepeat] = useState("");

  // The form only exists for an unassigned, unlocked token with the right.
  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const realmNames = Object.keys(realmsQuery.data ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
  const defaultRealm = realmsQuery.data
    ? (getDefaultRealmName(realmsQuery.data) ?? "")
    : "";
  // Users may only assign within their own realm; admins pick one.
  const activeRealm = isAdmin ? selectedRealm || defaultRealm : (user?.realm ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      assignToken(apiClient, {
        pin,
        realm: activeRealm,
        serial,
        user: fixUser(username)
      }),
    onSuccess: async () => {
      setUsername("");
      setPin("");
      setPinRepeat("");
      notify(t`Token assigned successfully.`, "success");
      await onRefresh();
    }
  });

  const pinsMatch = pin === pinRepeat;
  const canAssign = fixUser(username).length > 0 && activeRealm.length > 0 && pinsMatch;
  const selectRealm = (realm: string) => {
    setSelectedRealm(realm);
    setUsername("");
  };

  return {
    activeRealm,
    canAssign,
    isAdmin,
    mutation,
    pin,
    pinRepeat,
    pinsMatch,
    realmNames,
    realmsQuery,
    selectRealm,
    setPin,
    setPinRepeat,
    setUsername,
    username
  };
}
