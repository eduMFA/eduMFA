import { useLingui } from "@lingui/react/macro";
import { Text } from "@mantine/core";

import { RealmActionsCell } from "./RealmActionsCell";
import { RealmDefaultCell } from "./RealmDefaultCell";
import { RealmForm } from "./RealmForm";
import { RealmResolversCell } from "./RealmResolversCell";
import type { RealmEditing } from "./useRealmEditing";
import type { Realm, RealmsResponse, ResolverConfig } from "@/api/config";
import type { RealmResolverSelections } from "@/api/realms";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { Card } from "@/components/layout/Card";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";

interface RealmRow {
  name: string;
  realm: Realm;
}

export interface RealmTableProps {
  canDelete: boolean;
  canWrite: boolean;
  /** The realm whose deletion is in flight. */
  deletingName: string | undefined;
  editing: RealmEditing;
  isLoading: boolean;
  isSaving: boolean;
  onDelete: (name: string) => void;
  onSave: (name: string, selections: RealmResolverSelections) => void;
  onSetDefault: (name: string) => void;
  /** `undefined` until the realms arrived. */
  realms: RealmsResponse | undefined;
  resolvers: readonly ResolverConfig[];
  /** The realm being made the default. */
  settingDefaultName: string | undefined;
}

function toRows(realms: RealmsResponse | undefined): RealmRow[] {
  return Object.entries(realms ?? {}).map(([name, realm]) => ({ name, realm }));
}

/** The realm table: the default toggle, the resolvers (editable inline) and the row actions. */
export function RealmTable({
  canDelete,
  canWrite,
  deletingName,
  editing,
  isLoading,
  isSaving,
  onDelete,
  onSave,
  onSetDefault,
  realms,
  resolvers,
  settingDefaultName
}: RealmTableProps) {
  const { t } = useLingui();

  const columns: DataTableColumn<RealmRow>[] = [
    {
      header: t`Default`,
      key: "default",
      render: ({ name, realm }) => (
        <RealmDefaultCell
          canWrite={canWrite}
          isDefault={realm.default ?? false}
          isSetting={settingDefaultName === name}
          onSetDefault={() => {
            onSetDefault(name);
          }}
        />
      )
    },
    {
      header: t`Realm name`,
      key: "name",
      render: ({ name }) => (
        <Text fw={500} size="sm">
          {name}
        </Text>
      )
    },
    {
      header: t`resolvers`,
      key: "resolvers",
      render: ({ name, realm }) =>
        editing.editingRealm === name ? (
          <RealmForm
            idPrefix={`edit-${name}`}
            onChange={editing.setEditSelections}
            resolvers={resolvers}
            selections={editing.editSelections}
          />
        ) : (
          <RealmResolversCell realm={realm} />
        )
    },
    {
      align: "right",
      header: t`Actions`,
      key: "actions",
      render: ({ name, realm }) => (
        <RealmActionsCell
          canDelete={canDelete}
          canWrite={canWrite}
          editing={editing}
          isDeleting={deletingName === name}
          isSaving={isSaving}
          name={name}
          onDelete={() => {
            onDelete(name);
          }}
          onSave={(selections) => {
            onSave(name, selections);
          }}
          realm={realm}
        />
      )
    }
  ];

  return (
    <Card flush>
      {isLoading ? <LoadingIndicator label={t`Loading realms`} /> : null}
      <DataTable
        columns={columns}
        data={toRows(realms)}
        emptyMessage={t`No realms defined.`}
        getRowKey={(row) => row.name}
        id="tablerealms"
        isLoading={realms === undefined}
        minWidth={720}
      />
    </Card>
  );
}
