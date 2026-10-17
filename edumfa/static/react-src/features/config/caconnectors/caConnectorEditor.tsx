import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  caConnectorQueryKeys,
  getCaConnector,
  saveCaConnector,
  type CaConnectorWriteRequest
} from "@/api/caConnectors";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemLayout } from "@/features/config/system/SystemLayout";

export interface SaveCaConnectorVariables {
  /** The name from the form; renaming posts to the new name like the legacy page. */
  name: string;
  request: CaConnectorWriteRequest;
}

/**
 * The shared part of `LocalCAConnectorController` and
 * `MicrosoftCAConnectorController`: loads the connector when a name is in
 * the route, saves and returns to the list.
 */
export function useCaConnectorEditor(connectorName: string | undefined) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated, rights } = useAuth();
  const isEditing = connectorName !== undefined;

  const connectorQuery = useQuery({
    enabled: isAuthenticated && isEditing,
    queryFn: ({ signal }) => getCaConnector(apiClient, connectorName ?? "", signal),
    queryKey: caConnectorQueryKeys.detail(connectorName ?? "")
  });

  const saveMutation = useMutation({
    mutationFn: ({ name, request }: SaveCaConnectorVariables) =>
      saveCaConnector(apiClient, name, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: caConnectorQueryKeys.all });
      void navigate("/config/caconnectors/list");
    }
  });

  return {
    canWrite: hasRight(rights, "caconnectorwrite"),
    connector: connectorQuery.data?.[0] ?? null,
    connectorName,
    connectorQuery,
    isAuthenticated,
    isEditing,
    saveMutation
  };
}

export type CaConnectorEditor = ReturnType<typeof useCaConnectorEditor>;

export interface CaConnectorEditorFrameProps {
  editor: CaConnectorEditor;
  title: ReactNode;
}

/** The page around a connector form: layout, title, load state and errors. */
export function CaConnectorEditorFrame({
  children,
  editor,
  title
}: PropsWithChildren<CaConnectorEditorFrameProps>) {
  const { connector, connectorName, connectorQuery, isAuthenticated, isEditing } =
    editor;

  return (
    <SystemLayout activeItem="caconnectors">
      <PageHeader title={title} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={connectorQuery.error} />
      <ErrorAlert error={editor.saveMutation.error} />

      {isEditing && connectorQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading CA connector</Trans>} />
      ) : null}

      {isEditing && connectorQuery.isSuccess && !connector ? (
        <Alert color="yellow" mb="md" role="alert" variant="light">
          <Trans>The CA connector {connectorName} does not exist.</Trans>
        </Alert>
      ) : null}

      {isAuthenticated && (!isEditing || connector) ? children : null}
    </SystemLayout>
  );
}
