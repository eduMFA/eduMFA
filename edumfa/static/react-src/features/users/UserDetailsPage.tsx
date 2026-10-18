import { Trans, useLingui } from "@lingui/react/macro";
import { Text } from "@mantine/core";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { UserSidebar } from "./UserSidebar";
import { AssignTokenCard } from "./details/AssignTokenCard";
import { CustomAttributesCard } from "./details/CustomAttributesCard";
import { DeleteUserDialog } from "./details/DeleteUserDialog";
import { UserAttributesCard } from "./details/UserAttributesCard";
import { UserDetailsHeader } from "./details/UserDetailsHeader";
import { UserTokensCard } from "./details/UserTokensCard";
import { useAssignToken } from "./details/useAssignToken";
import { useCustomAttributes } from "./details/useCustomAttributes";
import { useUserDelete } from "./details/useUserDelete";
import { useUserDetail } from "./details/useUserDetail";
import { useUserEditor } from "./details/useUserEditor";
import { useUserTokens } from "./details/useUserTokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasEnrollRight, hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

export function UserDetailsPage() {
  const { realm = "", user: username = "" } = useParams();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();

  // Like the legacy controller, start at the top when a user is opened.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [realm, username]);

  const canLoad = isAuthenticated && username.length > 0;
  const { fields, resolverName, userDetail, userQuery } = useUserDetail(
    realm,
    username,
    canLoad
  );
  const tokens = useUserTokens(realm, username, canLoad);
  const customAttributes = useCustomAttributes(realm, username, canLoad);
  const editor = useUserEditor({ fields, realm, resolverName, userDetail, username });
  const deletion = useUserDelete(resolverName, username);
  const assignment = useAssignToken(realm, username);

  return (
    <SidebarLayout
      sidebar={<UserSidebar activeItem="details" detailsUsername={username} />}
    >
      <UserDetailsHeader
        realm={realm}
        resolverName={resolverName}
        username={username}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={userQuery.error} />
      <ErrorAlert error={editor.updateMutation.error} />
      <ErrorAlert error={deletion.deleteMutation.error} />
      <ErrorAlert error={customAttributes.addMutation.error} />
      <ErrorAlert error={customAttributes.deleteMutation.error} />
      <ErrorAlert error={assignment.mutation.error} />

      {userQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading user</Trans>} />
      ) : null}

      {userQuery.isSuccess && !userDetail ? (
        <ErrorAlert
          error={new Error(t`User not found.`)}
          title={<Trans>User not found.</Trans>}
        />
      ) : null}

      {userDetail ? (
        <UserAttributesCard
          canDelete={hasRight(rights, "deleteuser")}
          canUpdate={hasRight(rights, "updateuser")}
          editor={editor}
          fields={fields}
          onDelete={deletion.openDialog}
          userDetail={userDetail}
        />
      ) : null}

      {userDetail && customAttributes.isVisible ? (
        <CustomAttributesCard attributes={customAttributes} />
      ) : null}

      <UserTokensCard
        canEnroll={hasEnrollRight(rights)}
        realm={realm}
        tokens={tokens}
        username={username}
      />

      {hasRight(rights, "assign") ? <AssignTokenCard assignment={assignment} /> : null}

      <DeleteUserDialog
        isOpen={deletion.isDialogOpen}
        isPending={deletion.deleteMutation.isPending}
        onCancel={deletion.closeDialog}
        onConfirm={() => {
          deletion.deleteMutation.mutate();
        }}
      />

      {userDetail ? null : <Text size="sm" />}
    </SidebarLayout>
  );
}
