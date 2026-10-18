import { useState } from "react";

import type { Realm } from "@/api/config";
import type { RealmResolverSelections } from "@/api/realms";

/** The legacy `startEdit`: the realm's resolvers become the selection. */
function toSelections(realm: Realm): RealmResolverSelections {
  return Object.fromEntries(
    realm.resolver.map((resolver) => [
      resolver.name,
      { priority: resolver.priority, selected: true }
    ])
  );
}

export interface RealmEditing {
  cancelEdit: () => void;
  editSelections: RealmResolverSelections;
  /** The realm whose resolvers are edited inline; `null` while none is. */
  editingRealm: string | null;
  newRealmName: string;
  newSelections: RealmResolverSelections;
  /** Leaves the inline edit and clears the create form, as after a save. */
  reset: () => void;
  setEditSelections: (selections: RealmResolverSelections) => void;
  setNewRealmName: (name: string) => void;
  setNewSelections: (selections: RealmResolverSelections) => void;
  startEdit: (name: string, realm: Realm) => void;
}

/** The inline edit of a realm row and the create form below the table. */
export function useRealmEditing(): RealmEditing {
  const [editingRealm, setEditingRealm] = useState<string | null>(null);
  const [editSelections, setEditSelections] = useState<RealmResolverSelections>({});
  const [newRealmName, setNewRealmName] = useState("");
  const [newSelections, setNewSelections] = useState<RealmResolverSelections>({});

  const cancelEdit = () => {
    setEditingRealm(null);
    setEditSelections({});
  };

  return {
    cancelEdit,
    editSelections,
    editingRealm,
    newRealmName,
    newSelections,
    reset: () => {
      cancelEdit();
      setNewRealmName("");
      setNewSelections({});
    },
    setEditSelections,
    setNewRealmName,
    setNewSelections,
    startEdit: (name, realm) => {
      setEditingRealm(name);
      setEditSelections(toSelections(realm));
    }
  };
}
