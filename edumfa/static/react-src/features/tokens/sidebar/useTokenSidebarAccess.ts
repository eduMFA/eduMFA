import { useAuth } from "@/auth/AuthProvider";
import { hasEnrollRight, hasRight } from "@/auth/permissions";

/** The role and rights that decide which token navigation entries are shown. */
export function useTokenSidebarAccess() {
  const { rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const canEnroll = hasEnrollRight(rights);
  const canManageApplications =
    isAdmin &&
    hasRight(rights, "tokenlist") &&
    hasRight(rights, "machinelist") &&
    hasRight(rights, "manage_machine_tokens");

  return { canEnroll, canManageApplications, isAdmin, isUser, rights, settings };
}
