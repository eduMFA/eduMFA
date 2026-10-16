import { useQuery } from "@tanstack/react-query";
import { Trans } from "@lingui/react/macro";

import { getClientApplications } from "../../api/component";
import type { ClientApplication } from "../../api/component";
import { useApiClient } from "../../api/ApiClientProvider";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { EmptyState } from "../../components/tables/EmptyState";
import { useAuth } from "../../auth/AuthProvider";
import { formatLegacyDate } from "../../lib/dates";
import { hashHref } from "../../lib/hashbang";

export function ClientTypePage() {
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
    <div className="react-migration-shell">
      <div className="well">
        <ul className="nav nav-tabs">
          <li className="active">
            <a href={hashHref("/component/clienttype")}>
              <span className="glyphicon glyphicon-phone" aria-hidden="true" />
              <Trans>Application Type</Trans>
            </a>
          </li>
        </ul>

        <div className="react-route-toolbar">
          <button
            className="btn btn-default"
            disabled={!isAuthenticated || clientTypesQuery.isFetching}
            onClick={() => {
              void clientTypesQuery.refetch();
            }}
            type="button"
          >
            <span className="glyphicon glyphicon-refresh" aria-hidden="true" />
            <Trans>Refresh</Trans>
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="alert alert-warning" role="alert">
            <Trans>
              Log in through the legacy UI before opening this migrated route.
            </Trans>
          </div>
        ) : null}

        {clientTypesQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading client applications</Trans>} />
        ) : null}

        <ErrorAlert error={clientTypesQuery.error} />

        <table className="table table-striped">
          <thead>
            <tr>
              <th>
                <Trans>Application Type</Trans>
              </th>
              <th colSpan={2}>
                <Trans>Client</Trans>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && !clientTypesQuery.isLoading ? (
              <EmptyState message={<Trans>No client applications found.</Trans>} />
            ) : (
              entries.map(([applicationType, clients]) => (
                <ClientTypeRows
                  applicationType={applicationType}
                  clients={clients}
                  key={applicationType}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ClientTypeRowsProps {
  applicationType: string;
  clients: ClientApplication[];
}

function ClientTypeRows({ applicationType, clients }: ClientTypeRowsProps) {
  return (
    <>
      {clients.map((client, index) => (
        <tr key={`${applicationType}-${client.ip}-${client.lastseen ?? String(index)}`}>
          {index === 0 ? <td rowSpan={clients.length}>{applicationType}</td> : null}
          <td>{client.ip}</td>
          <td>
            {client.hostname ? `${client.hostname} - ` : ""}
            {formatLegacyDate(client.lastseen)}
          </td>
        </tr>
      ))}
    </>
  );
}
