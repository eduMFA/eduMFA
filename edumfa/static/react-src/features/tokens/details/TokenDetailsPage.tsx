import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { TokenDeleteDialog } from "./TokenDeleteDialog";
import { TokenDetailsActions } from "./TokenDetailsActions";
import { TokenFunctionsCard } from "./TokenFunctionsCard";
import { TokenMachinesCard } from "./TokenMachinesCard";
import { TokenPropertiesCard } from "./TokenPropertiesCard";
import { TokenUserCard } from "./TokenUserCard";
import { useDeleteToken } from "./useDeleteToken";
import { usePrefetchTokenLookups } from "./usePrefetchTokenLookups";
import { useApiClient } from "@/api/ApiClientProvider";
import { getTokenBySerial, tokenQueryKeys } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { TokenSidebar } from "@/features/tokens/TokenSidebar";

/**
 * Port of `token.details.html`. The token is read by serial from
 * `GET /token/`; the sections are separate cards. Deleting a hardware token
 * asks for confirmation like the legacy `dialogTokenDelete`; afterwards the
 * page returns to the token list because the legacy "previous state" is not
 * known to React.
 */
export function TokenDetailsPage() {
  const { serial = "" } = useParams();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { isAuthenticated, rights, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const tokenQuery = useQuery({
    enabled: isAuthenticated && serial.length > 0,
    queryFn: async ({ signal }) => {
      const response = await getTokenBySerial(apiClient, serial, signal);

      return response.tokens[0] ?? null;
    },
    queryKey: tokenQueryKeys.detail(serial)
  });
  const token = tokenQuery.data ?? null;
  usePrefetchTokenLookups(serial);
  const deletion = useDeleteToken({ serial, token });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
  };

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="details" serial={serial} />}>
      <PageHeader
        actions={
          <TokenDetailsActions
            isDeleting={deletion.mutation.isPending}
            onDelete={deletion.requestDelete}
            serial={serial}
            token={token}
          />
        }
        subtitle={token ? token.description : null}
        title={<Trans>Token details for {serial}</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={tokenQuery.error} />
      <ErrorAlert error={deletion.mutation.error} />

      {tokenQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading token</Trans>} />
      ) : null}

      {tokenQuery.isSuccess && !token ? (
        <ErrorAlert
          error={new Error(t`Token ${serial} not found.`)}
          title={<Trans>Token not found.</Trans>}
        />
      ) : null}

      {token ? (
        <>
          <TokenPropertiesCard onRefresh={refresh} serial={serial} token={token} />
          <TokenFunctionsCard onRefresh={refresh} serial={serial} token={token} />
          <TokenUserCard onRefresh={refresh} serial={serial} token={token} />
          {isAdmin && hasRight(rights, "manage_machine_tokens") ? (
            <TokenMachinesCard locked={token.locked} serial={serial} />
          ) : null}
        </>
      ) : null}

      <TokenDeleteDialog
        isOpen={deletion.isDialogOpen}
        isPending={deletion.mutation.isPending}
        onCancel={deletion.closeDialog}
        onConfirm={() => {
          deletion.mutation.mutate();
        }}
        serial={serial}
        token={token}
      />
    </SidebarLayout>
  );
}
