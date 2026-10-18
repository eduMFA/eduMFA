import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { TokengroupForm } from "./TokengroupForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { getTokengroup, tokengroupQueryKeys } from "@/api/tokengroups";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SystemLayout } from "@/features/config/system/SystemLayout";

/**
 * Port of `config.tokengroup.edit.html`: creates a token group under
 * `/config/tokengroup/edit` and edits one under `/config/tokengroup/edit/:groupname`.
 */
export function TokengroupEditPage() {
  const { groupname } = useParams();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
  const isEditing = groupname !== undefined;

  const groupQuery = useQuery({
    enabled: isAuthenticated && isEditing,
    queryFn: ({ signal }) => getTokengroup(apiClient, groupname ?? "", signal),
    queryKey: tokengroupQueryKeys.detail(groupname ?? "")
  });
  const group = isEditing ? groupQuery.data?.[groupname] : undefined;

  return (
    <SystemLayout activeItem="tokengroup">
      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={groupQuery.error} />

      {isEditing && groupQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading tokengroup</Trans>} />
      ) : null}

      {isEditing && groupQuery.isSuccess && !group ? (
        <Alert color="yellow" mb="md" role="alert" variant="light">
          <Trans>The tokengroup {groupname} does not exist.</Trans>
        </Alert>
      ) : null}

      {isAuthenticated && (!isEditing || group) ? (
        <TokengroupForm
          existing={isEditing ? { group: group ?? {}, groupname } : null}
          key={groupname ?? ""}
        />
      ) : null}
    </SystemLayout>
  );
}
