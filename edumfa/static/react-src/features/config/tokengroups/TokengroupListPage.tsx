import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { TokengroupTable } from "./TokengroupTable";
import { useTokengroupList } from "./useTokengroupList";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemLayout } from "@/features/config/system/SystemLayout";
import { hashHref } from "@/lib/hashbang";

/** Port of `config.tokengroup.list.html` and the list part of `tokengroupController`. */
export function TokengroupListPage() {
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const { deleteMutation, tokengroupsQuery } = useTokengroupList();
  const canAdd = hasRight(rights, "tokengroup_add");
  const canDelete = hasRight(rights, "tokengroup_delete");

  const deleteNamed = (groupname: string) => {
    requestDelete({
      identifier: groupname,
      onConfirm: () => {
        deleteMutation.mutate(groupname);
      }
    });
  };

  return (
    <SystemLayout activeItem="tokengroup">
      <PageHeader
        actions={
          canAdd ? (
            <Button
              component="a"
              href={hashHref("/config/tokengroup/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              <Trans>New Tokengroup definition</Trans>
            </Button>
          ) : null
        }
        title={<Trans>Tokengroups</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={tokengroupsQuery.error} />
      <ErrorAlert error={deleteMutation.error} />

      <TokengroupTable
        canDelete={canDelete}
        data={tokengroupsQuery.data}
        deletingName={deleteMutation.isPending ? deleteMutation.variables : undefined}
        isLoading={tokengroupsQuery.isLoading}
        onDelete={deleteNamed}
      />

      {dialog}
    </SystemLayout>
  );
}
