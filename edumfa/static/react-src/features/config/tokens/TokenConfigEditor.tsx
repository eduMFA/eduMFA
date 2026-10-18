import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";

import type { TokenConfigTypeKey } from "./tokenConfigForm";
import { TokenSettingsForm } from "./TokenSettingsForm";
import { TokenConfigSidebar } from "./TokenConfigSidebar";
import { tokenTypes } from "./tokenTypes";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getSystemConfig } from "@/api/config";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

/** Loads the system config and shows the form of one token type next to the sidebar. */
export function TokenConfigEditor({ tokenType }: { tokenType: TokenConfigTypeKey }) {
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
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
    <SidebarLayout sidebar={<TokenConfigSidebar tokenType={tokenType} />}>
      <PageHeader title={<Trans>{label} Token Settings</Trans>} />
      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={configQuery.error} />
          {configQuery.isLoading ? <LoadingIndicator /> : null}
          {configQuery.data ? (
            <TokenSettingsForm config={configQuery.data} tokenType={tokenType} />
          ) : null}
        </>
      )}
    </SidebarLayout>
  );
}
