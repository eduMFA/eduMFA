import { useQuery } from "@tanstack/react-query";
import { Trans } from "@lingui/react/macro";

import { getClientApplications } from "../../api/component";
import type { ClientApplication } from "../../api/component";
import { useApiClient } from "../../api/ApiClientProvider";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { EmptyState } from "../../components/tables/EmptyState";
import { useAuth } from "../../auth/AuthProvider";

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
            <a href="#/component/clienttype">
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

function formatLegacyDate(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = String(date.getFullYear());
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  const seconds = padDatePart(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}
