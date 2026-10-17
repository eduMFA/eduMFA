import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Button, NumberInput, TextInput } from "@mantine/core";
import { IconSearch, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DefinitionLayout,
  definitionRights,
  DefinitionPermissionAlert,
  type DefinitionKind
} from "./DefinitionLayout";
import { useDefinitionMutations, type DefinitionApi } from "./useDefinitionMutations";
import type { ApiClient } from "@/api/client";
import { useApiClient } from "@/api/ApiClientProvider";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ActiveToggleBadge } from "@/components/feedback/ActiveToggleBadge";
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
import { hashHref } from "@/lib/hashbang";

/** The fields every listed definition (event handler, periodic task) has in common. */
interface Definition {
  id: number;
  name: string;
  active: boolean;
  ordering: number;
}

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
  const { t } = useLingui();
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

  // Filter on the whole row so type specific columns are searchable too; ties sort by id.
  const rows = (query.data ?? [])
    .filter((row) => JSON.stringify(row).toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const compare =
        sort.by === "ordering"
          ? a.ordering - b.ordering
          : sort.by === "active"
            ? Number(a.active) - Number(b.active)
            : a.name.localeCompare(b.name);
      return (compare || a.id - b.id) * (sort.direction === "asc" ? 1 : -1);
    });

  const allColumns: DataTableColumn<T>[] = [
    {
      key: "ordering",
      header: <Trans>Order</Trans>,
      sortKey: "ordering",
      render: (row) =>
        canWrite ? (
          <OrderInput
            key={`${String(row.id)}:${String(row.ordering)}`}
            name={row.name}
            value={row.ordering}
            disabled={mutations.busy}
            onSave={(ordering) => {
              mutations.save.mutate(request({ ...row, ordering }));
            }}
          />
        ) : (
          row.ordering
        )
    },

    {
      key: "active",
      header: <Trans>Active</Trans>,
      sortKey: "active",
      render: (row) => (
        <ActiveToggleBadge
          active={row.active}
          enableLabel={t`Enable ${row.name}`}
          disableLabel={t`Disable ${row.name}`}
          onToggle={
            canWrite && !mutations.busy
              ? () => {
                  mutations.toggle.mutate({ id: row.id, active: !row.active });
                }
              : undefined
          }
        />
      )
    },

    {
      key: "name",
      header: <Trans>Description</Trans>,
      sortKey: "name",
      render: (row) => (
        <Anchor href={hashHref(`/config/${kind}/details/${String(row.id)}`)}>
          {row.name}
        </Anchor>
      )
    },

    ...columns,

    {
      key: "delete",
      header: "",
      render: (row) =>
        canWrite ? (
          <Button
            color="red"
            size="xs"
            variant="light"
            leftSection={<IconTrash aria-hidden size={16} />}
            disabled={mutations.busy}
            onClick={() => {
              requestDelete({
                identifier: row.name,
                question:
                  kind === "events" ? (
                    <Trans>Do you really want to delete this event?</Trans>
                  ) : (
                    <Trans>Do you really want to delete this periodic task?</Trans>
                  ),
                onConfirm: () => {
                  mutations.remove.mutate(row.id);
                }
              });
            }}
          >
            <Trans>Delete</Trans>
          </Button>
        ) : null
    }
  ];

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

/** Inline order editor that saves on blur or Enter, and only for a valid, changed value. */
function OrderInput({
  name,
  value,
  disabled,
  onSave
}: {
  name: string;
  value: number;
  disabled: boolean;
  onSave: (value: number) => void;
}) {
  const { t } = useLingui();
  const [order, setOrder] = useState<string | number>(value);

  const valid = typeof order === "number" && Number.isInteger(order) && order >= 0;
  return (
    <NumberInput
      aria-label={t`Order for ${name}`}
      min={0}
      allowDecimal={false}
      size="xs"
      w={85}
      value={order}
      onChange={setOrder}
      disabled={disabled}
      error={!valid}
      onBlur={() => {
        if (valid && order !== value) onSave(order);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}
