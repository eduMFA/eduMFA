import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { SmtpServerTable } from "./SmtpServerTable";
import { useSmtpServerList } from "./useSmtpServerList";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemLayout } from "@/features/config/system/SystemLayout";
import { hashHref } from "@/lib/hashbang";

/** Port of `config.smtp.list.html` and the list part of `smtpServerController`. */
export function SmtpServerListPage() {
  const { isAuthenticated, rights } = useAuth();
  const canWrite = hasRight(rights, "smtpserver_write");
  const { dialog, requestDelete } = useDeleteConfirmation();
  const { deleteMutation, serversQuery } = useSmtpServerList();

  const deleteNamed = (identifier: string) => {
    requestDelete({
      identifier,
      onConfirm: () => {
        deleteMutation.mutate(identifier);
      }
    });
  };

  return (
    <SystemLayout activeItem="smtp">
      <PageHeader
        actions={
          canWrite ? (
            <Button
              component="a"
              href={hashHref("/config/smtp/edit")}
              leftSection={<IconPlus size={16} />}
              variant="light"
            >
              <Trans>New SMTP server</Trans>
            </Button>
          ) : null
        }
        title={<Trans>SMTP servers</Trans>}
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={serversQuery.error} />
          <ErrorAlert error={deleteMutation.error} />

          <SmtpServerTable
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
