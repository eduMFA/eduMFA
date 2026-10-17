import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Divider, NavLink, Stack } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ComponentType } from "react";
import { Navigate, useParams } from "react-router-dom";

import {
  buildTokenConfigRequest,
  isTokenConfigTypeKey,
  isTokenConfigValid,
  readTokenConfigForm,
  tokenConfigTypeKeys,
  type TokenConfigEdits,
  type TokenConfigTypeKey
} from "./tokenConfigForm";
import { DayPasswordConfigFields } from "@/features/config/tokens/types/DayPasswordConfigFields";
import { EmailConfigFields } from "@/features/config/tokens/types/EmailConfigFields";
import { HotpConfigFields } from "@/features/config/tokens/types/HotpConfigFields";
import { QuestionConfigFields } from "@/features/config/tokens/types/QuestionConfigFields";
import { RadiusConfigFields } from "@/features/config/tokens/types/RadiusConfigFields";
import { RemoteConfigFields } from "@/features/config/tokens/types/RemoteConfigFields";
import { SmsConfigFields } from "@/features/config/tokens/types/SmsConfigFields";
import { TiqrConfigFields } from "@/features/config/tokens/types/TiqrConfigFields";
import { TotpConfigFields } from "@/features/config/tokens/types/TotpConfigFields";
import { U2fConfigFields } from "@/features/config/tokens/types/U2fConfigFields";
import { WebAuthnConfigFields } from "@/features/config/tokens/types/WebAuthnConfigFields";
import { YubicoConfigFields } from "@/features/config/tokens/types/YubicoConfigFields";
import { YubikeyConfigFields } from "@/features/config/tokens/types/YubikeyConfigFields";
import type {
  TokenConfigFieldsProps,
  TokenConfigUpdate
} from "@/features/config/tokens/types/types";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getSystemConfig, type SystemConfig } from "@/api/config";
import {
  deleteSystemConfig,
  saveSystemConfig,
  type SystemConfigRequest
} from "@/api/system";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";
import { notify } from "@/lib/notify";

const tokenTypes: Record<
  TokenConfigTypeKey,
  { label: string; Fields: ComponentType<TokenConfigFieldsProps> }
> = {
  hotp: { label: "HOTP", Fields: HotpConfigFields },
  totp: { label: "TOTP", Fields: TotpConfigFields },
  u2f: { label: "U2F", Fields: U2fConfigFields },
  webauthn: { label: "WebAuthn", Fields: WebAuthnConfigFields },
  radius: { label: "RADIUS", Fields: RadiusConfigFields },
  remote: { label: "Remote", Fields: RemoteConfigFields },
  sms: { label: "SMS", Fields: SmsConfigFields },
  tiqr: { label: "TiQR", Fields: TiqrConfigFields },
  email: { label: "EMail", Fields: EmailConfigFields },
  question: { label: "Questionnaire", Fields: QuestionConfigFields },
  yubico: { label: "Yubico", Fields: YubicoConfigFields },
  yubikey: { label: "Yubikey", Fields: YubikeyConfigFields },
  daypassword: { label: "DayPassword", Fields: DayPasswordConfigFields }
};

export function TokenConfigPage() {
  const { tokentype = "hotp" } = useParams();
  if (!isTokenConfigTypeKey(tokentype))
    return <Navigate replace to="/config/tokens/hotp" />;
  return <TokenConfigEditor key={tokentype} tokenType={tokentype} />;
}

function TokenConfigEditor({ tokenType }: { tokenType: TokenConfigTypeKey }) {
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
  const helpUrl = useDocsUrl("configuration/token_config.html");
  const configQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSystemConfig(apiClient, signal),
    queryKey: configQueryKeys.system
  });
  const label =
    tokenType === "question" ? (
      <Trans>Questionnaire</Trans>
    ) : (
      tokenTypes[tokenType].label
    );

  return (
    <SidebarLayout
      sidebar={
        <Stack gap={2}>
          {tokenConfigTypeKeys.map((key) => (
            <NavLink
              active={key === tokenType}
              component="a"
              href={hashHref(`/config/tokens/${key}`)}
              key={key}
              label={
                key === "question" ? (
                  <Trans>Questionnaire</Trans>
                ) : (
                  tokenTypes[key].label
                )
              }
            />
          ))}
          <Divider my="xs" />
          <NavLink
            component="a"
            href={helpUrl}
            label={<Trans>Help about Token Settings</Trans>}
            rel="noopener"
            target="_blank"
          />
        </Stack>
      }
    >
      <PageHeader title={<Trans>{label} Token Settings</Trans>} />
      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={configQuery.error} />
          {configQuery.isLoading ? <LoadingIndicator /> : null}
          {configQuery.data ? (
            <TokenConfigForm config={configQuery.data} tokenType={tokenType} />
          ) : null}
        </>
      )}
    </SidebarLayout>
  );
}

function TokenConfigForm({
  config,
  tokenType
}: {
  config: SystemConfig;
  tokenType: TokenConfigTypeKey;
}) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "configwrite");
  const canDelete = hasRight(rights, "configdelete");
  const { dialog, requestDelete } = useDeleteConfirmation();
  const [edits, setEdits] = useState<TokenConfigEdits>({});
  const [revision, setRevision] = useState(0);
  const base = readTokenConfigForm(config);
  const form = { ...base, ...edits };
  const request = buildTokenConfigRequest(base, edits);
  const valid = isTokenConfigValid(tokenType, form, edits);
  const saveMutation = useMutation({
    mutationFn: (payload: SystemConfigRequest) => saveSystemConfig(apiClient, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: configQueryKeys.system });
      setEdits({});
      setRevision((previous) => previous + 1);
      notify(t`Token configuration saved.`, "success");
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteSystemConfig(apiClient, key),
    onSuccess: async (_result, key) => {
      await queryClient.invalidateQueries({ queryKey: configQueryKeys.system });
      setEdits((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(([entryKey]) => entryKey !== key)
        )
      );
    }
  });
  const busy = saveMutation.isPending || deleteMutation.isPending;
  const save = () => {
    if (canWrite && valid && !busy && Object.keys(request).length)
      saveMutation.mutate(request);
  };
  const update = (changes: TokenConfigUpdate) => {
    setEdits((previous) => {
      return Object.fromEntries(
        Object.entries({ ...previous, ...changes }).filter(
          (entry): entry is [string, string | boolean] => entry[1] !== null
        )
      );
    });
  };
  const { Fields } = tokenTypes[tokenType];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <ErrorAlert error={saveMutation.error} />
      <ErrorAlert error={deleteMutation.error} />
      <Card
        footer={
          canWrite ? (
            <Button
              disabled={!valid || busy || !Object.keys(request).length}
              loading={saveMutation.isPending}
              type="submit"
            >
              <Trans>Save</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <fieldset
          disabled={busy}
          style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
        >
          <Fields
            canDelete={canDelete}
            canWrite={canWrite}
            form={form}
            isSaving={busy}
            key={revision}
            onChange={update}
            onSave={save}
            savedConfig={config}
            onDeleteEntry={(key) => {
              if (canDelete && !busy)
                requestDelete({
                  identifier: key,
                  question: (
                    <Trans>
                      Do you really want to delete this configuration entry?
                    </Trans>
                  ),
                  onConfirm: () => {
                    deleteMutation.mutate(key);
                  }
                });
            }}
          />
        </fieldset>
      </Card>
      {dialog}
    </form>
  );
}
