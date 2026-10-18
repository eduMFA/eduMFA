import { useQuery } from "@tanstack/react-query";

import { toPhoneList, type EnrollSession } from "./enrollForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { getUserDetails, userQueryKeys } from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { fixUser } from "@/lib/users";

export interface EnrollUserInfo {
  error: Error | null;
  /** Value of the `indexedsecret_preset_attribute` of the selected user. */
  indexedSecretPreset: string;
  userEmail: string;
  userPhones: string[];
}

export interface UseEnrollUserInfoOptions {
  /** An indexed secret is being enrolled and a preset attribute is configured. */
  needsIndexedSecretPreset: boolean;
  /** The realm the admin selected (or the default realm). */
  realm: string;
  /** `:user` of the enroll route. */
  routeUser: string;
  session: EnrollSession;
  /** The admin's user input. */
  user: string;
}

/**
 * Email, mobile number and the indexed secret preset come from the user
 * record. Admins get it once a suggestion was picked (or the user came
 * with the route), users read their own record like the legacy
 * `getUserDetails({})` call.
 */
export function useEnrollUserInfo({
  needsIndexedSecretPreset,
  realm,
  routeUser,
  session,
  user
}: UseEnrollUserInfoOptions): EnrollUserInfo {
  const apiClient = useApiClient();
  const { isAuthenticated, rights, settings } = useAuth();
  const isAdmin = session.role === "admin";
  const isUser = session.role === "user";
  const pickedUser = user.startsWith("[") || (routeUser !== "" && user === routeUser);
  const lookupUsername = isAdmin ? fixUser(user) : session.username;
  const lookupRealm = isAdmin ? realm : session.realm;
  const canLoadUserInfo =
    isAuthenticated &&
    (isAdmin
      ? pickedUser && lookupUsername !== "" && lookupRealm !== ""
      : isUser && (hasRight(rights, "userlist") || needsIndexedSecretPreset));
  const userInfoQuery = useQuery({
    enabled: canLoadUserInfo,
    queryFn: async ({ signal }) => {
      const users = await getUserDetails(
        apiClient,
        isAdmin ? { realm: lookupRealm, username: lookupUsername } : {},
        signal
      );

      return users[0] ?? null;
    },
    queryKey: isAdmin
      ? userQueryKeys.detail(lookupRealm, lookupUsername)
      : userQueryKeys.self
  });
  const userInfo = canLoadUserInfo ? (userInfoQuery.data ?? null) : null;

  return {
    error: userInfoQuery.error,
    indexedSecretPreset:
      needsIndexedSecretPreset && userInfo
        ? toPhoneList(userInfo[settings.indexedSecretPresetAttribute]).join("")
        : "",
    userEmail: typeof userInfo?.email === "string" ? userInfo.email : "",
    userPhones: toPhoneList(userInfo?.mobile)
  };
}
