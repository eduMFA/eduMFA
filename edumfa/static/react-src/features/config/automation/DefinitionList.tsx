import { Trans } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DefinitionLayout,
  definitionRights,
  type DefinitionKind
} from "./DefinitionLayout";
import { DefinitionPermissionAlert } from "./DefinitionPermissionAlert";
import { listDefinitionRows } from "./definitionRows";
import type { Definition } from "./types";
import { useDefinitionColumns } from "./useDefinitionColumns";
import { useDefinitionMutations, type DefinitionApi } from "./useDefinitionMutations";
import type { ApiClient } from "@/api/client";
import { useApiClient } from "@/api/ApiClientProvider";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort
} from "@/components/tables/DataTable";

interface Props<T extends Definition, R> {
  kind: DefinitionKind;
  api: DefinitionApi<R>;
  load: (client: ApiClient, signal?: AbortSignal) => Promise<T[]>;
  /** Turns a row back into the save request, used to persist an edited order. */
  request: (row: T) => R;
  /** Type specific columns, shown between the description and the delete button. */
  columns: DataTableColumn<T>[];
}

/**
 * Filterable, sortable table of event handlers or periodic tasks with inline
 * order editing, an active toggle and delete buttons, as far as the rights allow.
 */
export function DefinitionList<T extends Definition, R>({
  kind,
  api,
  load,
  request,
  columns
}: Props<T, R>) {
  const client = useApiClient();
  const { rights, isAuthenticated } = useAuth();
  const access = definitionRights(kind);
  const canRead = isAuthenticated && hasRight(rights, access.read);
  const canWrite = isAuthenticated && hasRight(rights, access.write);

  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<DataTableSort>({ by: "ordering", direction: "asc" });

  const query = useQuery({
    queryKey: [...api.queryKey, "list"],
    queryFn: ({ signal }) => load(client, signal),
    enabled: canRead
  });
  const mutations = useDefinitionMutations(api);
  const { dialog, requestDelete } = useDeleteConfirmation();

  const rows = listDefinitionRows(query.data ?? [], filter, sort);
  const allColumns = useDefinitionColumns({
    canWrite,
    columns,
    kind,
    mutations,
    request,
    requestDelete
  });

  return (
    <DefinitionLayout kind={kind}>
      <PageHeader
        title={
          kind === "events" ? (
            <Trans>Event Handlers</Trans>
          ) : (
            <Trans>Periodic Tasks</Trans>
          )
        }
      />

      {!canRead ? (
        <DefinitionPermissionAlert />
      ) : (
        <>
          <ErrorAlert error={query.error ?? mutations.error} />

          <TextInput
            mb="md"
            label={<Trans>Filter definitions</Trans>}
            leftSection={<IconSearch aria-hidden size={16} />}
            value={filter}
            onChange={(event) => {
              setFilter(event.currentTarget.value);
            }}
          />

          <Card flush>
            {query.isLoading ? <LoadingIndicator /> : null}
            <DataTable
              columns={allColumns}
              data={rows}
              getRowKey={(row) => String(row.id)}
              emptyMessage={<Trans>No definitions found.</Trans>}
              isLoading={query.data === undefined}
              minWidth={950}
              sort={sort}
              onSortChange={setSort}
            />
          </Card>
        </>
      )}

      {dialog}
    </DefinitionLayout>
  );
}
