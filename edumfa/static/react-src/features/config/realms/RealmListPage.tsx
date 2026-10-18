import { useLingui } from "@lingui/react/macro";

import { NewRealmCard } from "./NewRealmCard";
import { RealmSidebar } from "./RealmSidebar";
import { RealmTable } from "./RealmTable";
import { useRealmEditing } from "./useRealmEditing";
import { useRealmList } from "./useRealmList";
import { useRealmMutations } from "./useRealmMutations";
import type { RealmResolverSelections } from "@/api/realms";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

/**
 * Port of `config.realms.list.html` and the realm part of `configController`:
 * the realm table with the default realm toggle, inline editing of the
 * resolvers and priorities, deletion, and the create form below the table.
 */
export function RealmListPage() {
  const { t } = useLingui();

  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const editing = useRealmEditing();
  const { realmsQuery, resolvers, resolversQuery } = useRealmList();
  const { clearDefaultMutation, deleteMutation, saveMutation, setDefaultMutation } =
    useRealmMutations(editing.reset);
  const canWrite = hasRight(rights, "resolverwrite");
  const canDelete = hasRight(rights, "resolverdelete");

  const deleteNamed = (name: string) => {
    requestDelete({
      identifier: name,
      onConfirm: () => {
        deleteMutation.mutate(name);
      }
    });
  };
  const save = (realmName: string, selections: RealmResolverSelections) => {
    saveMutation.mutate({ realmName, selections });
  };

  return (
    <SidebarLayout
      sidebar={
        <RealmSidebar
          canClearDefault={isAuthenticated && canWrite}
          isClearing={clearDefaultMutation.isPending}
          onClearDefault={() => {
            clearDefaultMutation.mutate();
          }}
        />
      }
    >
      <PageHeader title={t`Realms`} />

      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : (
        <>
          <ErrorAlert error={realmsQuery.error} />
          <ErrorAlert error={resolversQuery.error} />
          <ErrorAlert error={saveMutation.error} />
          <ErrorAlert error={deleteMutation.error} />
          <ErrorAlert error={setDefaultMutation.error} />
          <ErrorAlert error={clearDefaultMutation.error} />

          <RealmTable
            canDelete={canDelete}
            canWrite={canWrite}
            deletingName={
              deleteMutation.isPending ? deleteMutation.variables : undefined
            }
            editing={editing}
            isLoading={realmsQuery.isLoading}
            isSaving={saveMutation.isPending}
            onDelete={deleteNamed}
            onSave={save}
            onSetDefault={(name) => {
              setDefaultMutation.mutate(name);
            }}
            realms={realmsQuery.data}
            resolvers={resolvers}
            settingDefaultName={
              setDefaultMutation.isPending ? setDefaultMutation.variables : undefined
            }
          />

          {canWrite && editing.editingRealm === null ? (
            <NewRealmCard
              isSaving={saveMutation.isPending}
              name={editing.newRealmName}
              onNameChange={editing.setNewRealmName}
              onSave={save}
              onSelectionsChange={editing.setNewSelections}
              resolvers={resolvers}
              selections={editing.newSelections}
            />
          ) : null}
          {dialog}
        </>
      )}
    </SidebarLayout>
  );
}
