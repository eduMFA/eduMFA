import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconRefresh, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { TokenFunctionsCard } from "./TokenFunctionsCard";
import { TokenMachinesCard } from "./TokenMachinesCard";
import { TokenPropertiesCard } from "./TokenPropertiesCard";
import { TokenUserCard } from "./TokenUserCard";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  configQueryKeys,
  getRealms,
  getSystemConfig,
  getTokengroups
} from "@/api/config";
import {
  getApplicationDefinitions,
  getMachineTokens,
  machineQueryKeys
} from "@/api/machines";
import { deleteToken, getTokenBySerial, tokenQueryKeys } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasEnrollRight, hasRight } from "@/auth/permissions";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { pushFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { prefetchQuery } from "@/lib/prefetch";
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
  const navigate = useNavigate();
  const { t } = useLingui();
  const { isAuthenticated, rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const tokenQuery = useQuery({
    enabled: isAuthenticated && serial.length > 0,
    queryFn: async ({ signal }) => {
      const response = await getTokenBySerial(apiClient, serial, signal);

      return response.tokens[0] ?? null;
    },
    queryKey: tokenQueryKeys.detail(serial)
  });
  const token = tokenQuery.data ?? null;

  // The cards only mount once the token is here, but their lookups do not
  // depend on it. Starting them now saves the round trip the cards would
  // otherwise add; their own queries then find the data in flight.
  const canListGroups = isAdmin && hasRight(rights, "tokengroup_list");
  const canManageMachines = isAdmin && hasRight(rights, "manage_machine_tokens");
  useEffect(() => {
    if (!isAuthenticated || serial.length === 0) {
      return;
    }

    prefetchQuery(queryClient, configQueryKeys.system, ({ signal }) =>
      getSystemConfig(apiClient, signal)
    );

    if (isAdmin) {
      prefetchQuery(queryClient, configQueryKeys.realms, ({ signal }) =>
        getRealms(apiClient, signal)
      );
    }

    if (canListGroups) {
      prefetchQuery(queryClient, configQueryKeys.tokengroups, ({ signal }) =>
        getTokengroups(apiClient, signal)
      );
    }

    if (canManageMachines) {
      prefetchQuery(queryClient, machineQueryKeys.tokens({ serial }), ({ signal }) =>
        getMachineTokens(apiClient, { serial }, signal)
      );
      prefetchQuery(
        queryClient,
        machineQueryKeys.applicationDefinitions,
        ({ signal }) => getApplicationDefinitions(apiClient, signal)
      );
    }
  }, [
    apiClient,
    canListGroups,
    canManageMachines,
    isAdmin,
    isAuthenticated,
    queryClient,
    serial
  ]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteToken(apiClient, serial),
    onSettled: () => {
      setIsDeleteDialogOpen(false);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
      pushFlash(t`Token ${serial} deleted.`, "success");
      void navigate("/token/list");
    }
  });

  const requestDelete = () => {
    // Hardware tokens are asked about; software tokens go straight away.
    if (token?.info.tokenkind === "hardware") {
      setIsDeleteDialogOpen(true);
    } else {
      deleteMutation.mutate();
    }
  };

  const canDelete = hasRight(rights, "delete");
  const rolloverHref =
    token !== null &&
    hasEnrollRight(rights) &&
    settings.tokenRollover.includes(token.tokentype) &&
    token.info.tokenkind === "software"
      ? hashHref(
          `/token/rollover/${encodeURIComponent(token.tokentype)}/${encodeURIComponent(serial)}`
        )
      : null;

  const headerActions = (
    <>
      {hasRight(rights, "auditlog") ? (
        <Button
          component="a"
          href={hashHref(`/audit/log?serial=${encodeURIComponent(serial)}`)}
          leftSection={<IconSearch size={16} />}
          variant="default"
        >
          <Trans>View token in Audit log</Trans>
        </Button>
      ) : null}
      {rolloverHref ? (
        <Button
          color="red"
          component="a"
          href={rolloverHref}
          id="rolloverButton"
          leftSection={<IconRefresh size={16} />}
          variant="light"
        >
          <Trans>Rollover</Trans>
        </Button>
      ) : null}
      {token && (canDelete || !settings.hideButtons) ? (
        <Button
          color="red"
          disabled={!canDelete}
          id="deleteButton"
          leftSection={<IconTrash size={16} />}
          loading={deleteMutation.isPending}
          onClick={requestDelete}
        >
          <Trans>Delete</Trans>
        </Button>
      ) : null}
    </>
  );

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="details" serial={serial} />}>
      <PageHeader
        actions={headerActions}
        subtitle={token ? token.description : null}
        title={<Trans>Token details for {serial}</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={tokenQuery.error} />
      <ErrorAlert error={deleteMutation.error} />

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

      <ConfirmDialog
        confirmLabel={<Trans>Delete Token</Trans>}
        id="dialogTokenDelete"
        isOpen={isDeleteDialogOpen}
        isPending={deleteMutation.isPending}
        message={
          token?.username ? (
            <Trans>
              Do you really want to delete the Token {serial} from user {token.username}
              ?
            </Trans>
          ) : (
            <Trans>Do you really want to delete the Token {serial}?</Trans>
          )
        }
        onCancel={() => {
          setIsDeleteDialogOpen(false);
        }}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
        title={<Trans>Delete Token</Trans>}
      />
    </SidebarLayout>
  );
}
