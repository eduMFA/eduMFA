import { RealmEditActions } from "./RealmEditActions";
import { isRealmSelectionValid } from "./RealmForm";
import { RealmRowActions } from "./RealmRowActions";
import type { RealmEditing } from "./useRealmEditing";
import type { Realm } from "@/api/config";
import type { RealmResolverSelections } from "@/api/realms";

export interface RealmActionsCellProps {
  canDelete: boolean;
  canWrite: boolean;
  editing: RealmEditing;
  isDeleting: boolean;
  isSaving: boolean;
  name: string;
  onDelete: () => void;
  onSave: (selections: RealmResolverSelections) => void;
  realm: Realm;
}

/** The "Actions" column: the inline edit's save and cancel, or edit and delete. */
export function RealmActionsCell({
  canDelete,
  canWrite,
  editing,
  isDeleting,
  isSaving,
  name,
  onDelete,
  onSave,
  realm
}: RealmActionsCellProps) {
  if (editing.editingRealm === name) {
    return (
      <RealmEditActions
        canWrite={canWrite}
        isSaveDisabled={!isRealmSelectionValid(editing.editSelections)}
        isSaving={isSaving}
        onCancel={editing.cancelEdit}
        onSave={() => {
          onSave(editing.editSelections);
        }}
      />
    );
  }

  // The legacy template hid the row actions while another realm was edited.
  if (editing.editingRealm !== null) {
    return null;
  }

  return (
    <RealmRowActions
      canDelete={canDelete}
      canWrite={canWrite}
      isDeleting={isDeleting}
      onDelete={onDelete}
      onEdit={() => {
        editing.startEdit(name, realm);
      }}
    />
  );
}
