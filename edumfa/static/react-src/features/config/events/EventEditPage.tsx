import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { EventForm } from "./EventForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { eventQueryKeys, getEvent } from "@/api/events";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { DefinitionLayout } from "@/features/config/automation/DefinitionLayout";
import { DefinitionPermissionAlert } from "@/features/config/automation/DefinitionPermissionAlert";

/** Route entry: loads the handler (when editing) and checks permissions before rendering the form. */
export function EventEditPage() {
  const { eventid } = useParams();
  const client = useApiClient();
  const { rights, isAuthenticated } = useAuth();
  const allowed =
    isAuthenticated &&
    hasRight(rights, eventid ? "eventhandling_read" : "eventhandling_write");

  const query = useQuery({
    queryKey: eventQueryKeys.detail(eventid ?? ""),
    queryFn: ({ signal }) => getEvent(client, eventid ?? "", signal),
    enabled: allowed && Boolean(eventid)
  });
  const existing = query.data?.[0];

  return (
    <DefinitionLayout kind="events">
      {!allowed ? (
        <DefinitionPermissionAlert />
      ) : (
        <>
          <ErrorAlert error={query.error} />
          {query.isLoading ? <LoadingIndicator /> : null}

          {eventid && query.isSuccess && !existing ? (
            <Alert color="yellow" role="alert">
              <Trans>The event handler does not exist.</Trans>
            </Alert>
          ) : null}

          {!eventid || existing ? (
            <EventForm key={eventid ?? "new"} existing={existing} />
          ) : null}
        </>
      )}
    </DefinitionLayout>
  );
}
