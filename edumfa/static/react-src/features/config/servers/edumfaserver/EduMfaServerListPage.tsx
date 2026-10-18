import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { EduMfaServerTable } from "./EduMfaServerTable";
import { useEduMfaServerList } from "./useEduMfaServerList";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemLayout } from "@/features/config/system/SystemLayout";
import { hashHref } from "@/lib/hashbang";

/** Port of `config.edumfaserver.list.html` and the list part of `eduMfaServerController`. */
export function EduMfaServerListPage() {
  const { t } = useLingui();

  const { isAuthenticated, rights } = useAuth();
  const canWrite = hasRight(rights, "edumfaserver_write");
  const { dialog, requestDelete } = useDeleteConfirmation();
  const { deleteMutation, serversQuery } = useEduMfaServerList();

  const deleteNamed = (identifier: string) => {
    requestDelete({
      identifier,
      onConfirm: () => {
        deleteMutation.mutate(identifier);
      }
    });
  };

  return (
    <SystemLayout activeItem="edumfaserver">
      <PageHeader
        actions={
          canWrite ? (
            <Button
              component="a"
              href={hashHref("/config/edumfaserver/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              {t`New eduMFA server`}
            </Button>
          ) : null
        }
        title={t`eduMFA servers`}
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={serversQuery.error} />
          <ErrorAlert error={deleteMutation.error} />

          <EduMfaServerTable
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
