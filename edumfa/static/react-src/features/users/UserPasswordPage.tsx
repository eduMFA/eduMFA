import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";

import { ChangePasswordForm } from "./ChangePasswordForm";
import { UserProfileCard } from "./UserProfileCard";
import { UserSidebar } from "./UserSidebar";
import { useChangePassword } from "./useChangePassword";
import { useApiClient } from "@/api/ApiClientProvider";
import { getUserDetails, userQueryKeys } from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

/**
 * Port of `user.password.html`: a user's own details plus the password form
 * shown when the user store is editable. `GET /user/` without parameters
 * resolves to the authenticated user on the backend.
 */
export function UserPasswordPage() {
  const apiClient = useApiClient();
  const { isAuthenticated, rights, user } = useAuth();

  const userQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: async ({ signal }) => {
      const users = await getUserDetails(apiClient, {}, signal);

      return users[0] ?? null;
    },
    queryKey: userQueryKeys.self
  });
  const userDetail = userQuery.data ?? null;
  const changePassword = useChangePassword(userDetail);

  const canSetPassword =
    Boolean(userDetail?.editable) && hasRight(rights, "updateuser");

  return (
    <SidebarLayout sidebar={<UserSidebar activeItem="password" />}>
      <PageHeader
        subtitle={user?.realm ? <Trans>Realm {user.realm}</Trans> : null}
        title={<Trans>Your details</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={userQuery.error} />
      <ErrorAlert error={changePassword.mutation.error} />

      {userQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading user</Trans>} />
      ) : null}

      {userDetail ? <UserProfileCard userDetail={userDetail} /> : null}

      {userDetail && canSetPassword ? (
        <ChangePasswordForm changePassword={changePassword} />
      ) : null}
    </SidebarLayout>
  );
}
