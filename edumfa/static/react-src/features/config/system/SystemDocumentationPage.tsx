import { Trans } from "@lingui/react/macro";
import { Button, ScrollArea, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import { SystemLayout } from "./SystemLayout";
import { useApiClient } from "@/api/ApiClientProvider";
import { getSystemDocumentation, systemQueryKeys } from "@/api/system";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Port of `config.system.doc.html` and `getSystemDocumentation`: the
 * reStructuredText description of the installation from
 * `GET /system/documentation`, shown read-only with a download.
 */
export function SystemDocumentationPage() {
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();

  const documentationQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSystemDocumentation(apiClient, signal),
    queryKey: systemQueryKeys.documentation
  });
  const documentation = documentationQuery.data;
  const downloadHref =
    documentation === undefined
      ? null
      : `data:text/plain;charset=utf-8,${encodeURIComponent(documentation)}`;

  return (
    <SystemLayout activeItem="documentation">
      <PageHeader
        actions={
          downloadHref ? (
            <Button
              component="a"
              download="documentation.rst"
              href={downloadHref}
              leftSection={<IconDownload size={16} />}
              variant="default"
            >
              <Trans>Download documentation</Trans>
            </Button>
          ) : null
        }
        title={<Trans>System Documentation</Trans>}
      />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={documentationQuery.error} />
          <Card>
            <Text c="dimmed" mb="sm" size="sm">
              <Trans>
                This documentation contains the current configuration of your system in
                restructured text. You can use this to document your installed system.
              </Trans>
            </Text>
            {documentationQuery.isPending ? <LoadingIndicator /> : null}
            {documentation === undefined ? null : (
              <ScrollArea.Autosize mah={600} type="auto">
                <Text
                  component="pre"
                  data-field="systemDocumentation"
                  ff="monospace"
                  m={0}
                  size="xs"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {documentation}
                </Text>
              </ScrollArea.Autosize>
            )}
          </Card>
        </>
      )}
    </SystemLayout>
  );
}
