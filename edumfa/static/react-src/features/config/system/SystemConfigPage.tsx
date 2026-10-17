import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AuthenticationSettingsCard } from "./AuthenticationSettingsCard";
import { ServerSettingsCard } from "./ServerSettingsCard";
import { SystemLayout } from "./SystemLayout";
import { TokenDefaultsCard } from "./TokenDefaultsCard";
import {
  buildSystemConfigRequest,
  readSystemConfigForm,
  type SystemConfigFormUpdate
} from "./systemConfigForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getSystemConfig } from "@/api/config";
import {
  getSmtpServers,
  saveSystemConfig,
  systemQueryKeys,
  type SystemConfigRequest
} from "@/api/system";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { notify } from "@/lib/notify";

/**
 * Port of `config.system.edit.html` and the system part of
 * `configController`. The loaded config is shown with the staged edits on
 * top; "Save System Config" posts the form to `POST /system/setConfig`.
 */
export function SystemConfigPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();
  const canWrite = hasRight(rights, "configwrite");
  const [edits, setEdits] = useState<SystemConfigFormUpdate>({});

  const configQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSystemConfig(apiClient, signal),
    queryKey: configQueryKeys.system
  });
  const smtpServersQuery = useQuery({
    enabled: isAuthenticated && hasRight(rights, "smtpserver_read"),
    queryFn: ({ signal }) => getSmtpServers(apiClient, signal),
    queryKey: systemQueryKeys.smtpServers
  });

  const saveMutation = useMutation({
    mutationFn: (request: SystemConfigRequest) => saveSystemConfig(apiClient, request),
    onSuccess: async () => {
      notify(t`System Config saved.`, "info");
      await queryClient.invalidateQueries({ queryKey: configQueryKeys.system });
      setEdits({});
    }
  });

  const form = configQuery.data
    ? { ...readSystemConfigForm(configQuery.data), ...edits }
    : null;
  const smtpIdentifiers = Object.keys(smtpServersQuery.data ?? {});

  const updateForm = (update: SystemConfigFormUpdate) => {
    setEdits((previous) => ({ ...previous, ...update }));
  };

  return (
    <SystemLayout activeItem="system">
      <PageHeader title={<Trans>System Config</Trans>} />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={configQuery.error} />
          <ErrorAlert error={smtpServersQuery.error} />
          <ErrorAlert error={saveMutation.error} />
          {configQuery.isPending ? <LoadingIndicator /> : null}

          {form ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (canWrite) {
                  saveMutation.mutate(buildSystemConfigRequest(form));
                }
              }}
            >
              <AuthenticationSettingsCard form={form} onChange={updateForm} />
              <ServerSettingsCard
                form={form}
                onChange={updateForm}
                smtpIdentifiers={smtpIdentifiers}
              />
              <TokenDefaultsCard form={form} onChange={updateForm} />
              {canWrite ? (
                <Group justify="center">
                  <Button loading={saveMutation.isPending} type="submit">
                    <Trans>Save System Config</Trans>
                  </Button>
                </Group>
              ) : null}
            </form>
          ) : null}
        </>
      )}
    </SystemLayout>
  );
}
