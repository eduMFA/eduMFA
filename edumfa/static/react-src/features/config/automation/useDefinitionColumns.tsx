import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";
import { DefinitionDeleteButton } from "./DefinitionDeleteButton";
import type { DefinitionKind } from "./DefinitionLayout";
import { OrderInput } from "./OrderInput";
import type { Definition, DefinitionMutations } from "./types";
import { ActiveToggleBadge } from "@/components/feedback/ActiveToggleBadge";
import type { DeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import type { DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

/** Order, active and description columns, the type specific ones and the delete button. */
export function useDefinitionColumns<T extends Definition, R>({
  canWrite,
  columns,
  kind,
  mutations,
  request,
  requestDelete
}: {
  canWrite: boolean;
  columns: DataTableColumn<T>[];
  kind: DefinitionKind;
  mutations: DefinitionMutations<R>;
  request: (row: T) => R;
  requestDelete: DeleteConfirmation["requestDelete"];
}): DataTableColumn<T>[] {
  const { t } = useLingui();

  return [
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
          <DefinitionDeleteButton
            disabled={mutations.busy}
            kind={kind}
            name={row.name}
            requestDelete={requestDelete}
            onConfirm={() => {
              mutations.remove.mutate(row.id);
            }}
          />
        ) : null
    }
  ];
}
