import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { RadiusServerTable } from "./RadiusServerTable";
import { useRadiusServerList } from "./useRadiusServerList";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemLayout } from "@/features/config/system/SystemLayout";
import { hashHref } from "@/lib/hashbang";

/** Port of `config.radius.list.html` and the list part of `radiusServerController`. */
export function RadiusServerListPage() {
  const { isAuthenticated, rights } = useAuth();
  const canWrite = hasRight(rights, "radiusserver_write");
  const { dialog, requestDelete } = useDeleteConfirmation();
  const { deleteMutation, serversQuery } = useRadiusServerList();

  const deleteNamed = (identifier: string) => {
    requestDelete({
      identifier,
      onConfirm: () => {
        deleteMutation.mutate(identifier);
      }
    });
  };

  return (
    <SystemLayout activeItem="radius">
      <PageHeader
        actions={
          canWrite ? (
            <Button
              component="a"
              href={hashHref("/config/radius/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              <Trans>New RADIUS server</Trans>
            </Button>
          ) : null
        }
        title={<Trans>RADIUS servers</Trans>}
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={serversQuery.error} />
          <ErrorAlert error={deleteMutation.error} />

          <RadiusServerTable
            canWrite={canWrite}
            data={serversQuery.data}
            deletingName={
              deleteMutation.isPending ? deleteMutation.variables : undefined
            }
            isLoading={serversQuery.isLoading}
            onDelete={deleteNamed}
          />
          {dialog}
        </>
      )}
    </SystemLayout>
  );
}
