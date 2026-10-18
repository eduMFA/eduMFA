import { useLingui } from "@lingui/react/macro";
import { Box, Button, Table } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import { ClientTypeRows } from "./ClientTypeRows";
import { getClientApplications } from "@/api/component";
import { useApiClient } from "@/api/ApiClientProvider";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/tables/EmptyState";

export function ClientTypePage() {
  const { t } = useLingui();

  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
  const clientTypesQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getClientApplications(apiClient, signal),
    queryKey: ["component", "clienttype"]
  });

  const entries = Object.entries(clientTypesQuery.data ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  return (
    <Box className="react-migration-shell">
      <PageHeader
        actions={
          <Button
            disabled={!isAuthenticated}
            leftSection={<IconRefresh size={16} />}
            loading={clientTypesQuery.isFetching}
            onClick={() => {
              void clientTypesQuery.refetch();
            }}
            variant="default"
          >
            {t`Refresh`}
          </Button>
        }
        subtitle={t`Client applications seen by this eduMFA instance.`}
        title={t`Application Type`}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={clientTypesQuery.error} />

      <Card flush>
        {clientTypesQuery.isLoading ? (
          <LoadingIndicator label={t`Loading client applications`} />
        ) : null}

        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th c="dimmed" fz="xs" tt="uppercase">
                {t`Application Type`}
              </Table.Th>
              <Table.Th c="dimmed" colSpan={2} fz="xs" tt="uppercase">
                {t`Client`}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.length === 0 && !clientTypesQuery.isLoading ? (
              <EmptyState message={t`No client applications found.`} />
            ) : (
              entries.map(([applicationType, clients]) => (
                <ClientTypeRows
                  applicationType={applicationType}
                  clients={clients}
                  key={applicationType}
                />
              ))
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Box>
  );
}
