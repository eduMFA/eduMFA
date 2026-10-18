import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { TaskForm } from "./TaskForm";
import { useApiClient } from "@/api/ApiClientProvider";
import { periodicTaskQueryKeys, getPeriodicTask } from "@/api/periodicTasks";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { DefinitionLayout } from "@/features/config/automation/DefinitionLayout";
import { DefinitionPermissionAlert } from "@/features/config/automation/DefinitionPermissionAlert";

/** Route entry: loads the task (when editing) and checks permissions before rendering the form. */
export function PeriodicTaskEditPage() {
  const { ptaskid } = useParams();
  const client = useApiClient();
  const { rights, isAuthenticated } = useAuth();
  const allowed =
    isAuthenticated &&
    hasRight(rights, ptaskid ? "periodictask_read" : "periodictask_write");

  const query = useQuery({
    queryKey: periodicTaskQueryKeys.detail(ptaskid ?? ""),
    queryFn: ({ signal }) => getPeriodicTask(client, ptaskid ?? "", signal),
    enabled: allowed && Boolean(ptaskid)
  });

  return (
    <DefinitionLayout kind="periodictasks">
      {!allowed ? (
        <DefinitionPermissionAlert />
      ) : (
        <>
          <ErrorAlert error={query.error} />
          {query.isLoading ? <LoadingIndicator /> : null}

          {!ptaskid || query.data ? (
            <TaskForm key={ptaskid ?? "new"} existing={query.data} />
          ) : null}
        </>
      )}
    </DefinitionLayout>
  );
}
