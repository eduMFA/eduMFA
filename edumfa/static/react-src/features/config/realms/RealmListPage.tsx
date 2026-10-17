import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Badge, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconCheck, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { isRealmSelectionValid, RealmForm, realmNamePattern } from "./RealmForm";
import { RealmSidebar } from "./RealmSidebar";
import { resolverEditHref } from "./resolverLinks";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms, getResolvers, type Realm } from "@/api/config";
import {
  buildRealmRequest,
  clearDefaultRealm,
  deleteRealm,
  setDefaultRealm,
  setRealm,
  type RealmResolverSelections
} from "@/api/realms";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";

interface RealmRow {
  name: string;
  realm: Realm;
}

interface SaveRealmVariables {
  realmName: string;
  selections: RealmResolverSelections;
}

/** The legacy `startEdit`: the realm's resolvers become the selection. */
function toSelections(realm: Realm): RealmResolverSelections {
  return Object.fromEntries(
    realm.resolver.map((resolver) => [
      resolver.name,
      { priority: resolver.priority, selected: true }
    ])
  );
}

/**
 * Port of `config.realms.list.html` and the realm part of `configController`:
 * the realm table with the default realm toggle, inline editing of the
 * resolvers and priorities, deletion, and the create form below the table.
 */
export function RealmListPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const [editingRealm, setEditingRealm] = useState<string | null>(null);
  const [editSelections, setEditSelections] = useState<RealmResolverSelections>({});
  const [newRealmName, setNewRealmName] = useState("");
  const [newSelections, setNewSelections] = useState<RealmResolverSelections>({});

  const realmsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const resolversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getResolvers(apiClient, undefined, signal),
    queryKey: configQueryKeys.resolvers()
  });

  const invalidateRealms = () =>
    queryClient.invalidateQueries({ queryKey: configQueryKeys.realms });
  const cancelEdit = () => {
    setEditingRealm(null);
    setEditSelections({});
  };
  const saveMutation = useMutation({
    mutationFn: ({ realmName, selections }: SaveRealmVariables) =>
      setRealm(apiClient, realmName, buildRealmRequest(selections)),
    onSuccess: async () => {
      cancelEdit();
      setNewRealmName("");
      setNewSelections({});
      await invalidateRealms();
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (realmName: string) => deleteRealm(apiClient, realmName),
    onSuccess: invalidateRealms
  });
  const setDefaultMutation = useMutation({
    mutationFn: (realmName: string) => setDefaultRealm(apiClient, realmName),
    onSuccess: invalidateRealms
  });
  const clearDefaultMutation = useMutation({
    mutationFn: () => clearDefaultRealm(apiClient),
    onSuccess: invalidateRealms
  });

  const canWrite = hasRight(rights, "resolverwrite");
  const canDelete = hasRight(rights, "resolverdelete");
  const rows: RealmRow[] = Object.entries(realmsQuery.data ?? {}).map(
    ([name, realm]) => ({ name, realm })
  );
  const resolvers = Object.values(resolversQuery.data ?? {});
  const isNewRealmNameValid = realmNamePattern.test(newRealmName);
  const isNewRealmValid = isNewRealmNameValid && isRealmSelectionValid(newSelections);

  const columns: DataTableColumn<RealmRow>[] = [
    {
      header: <Trans>Default</Trans>,
      key: "default",
      render: ({ name, realm }) =>
        realm.default ? (
          <Badge
            color="green"
            leftSection={<IconCheck size={12} />}
            miw="max-content"
            style={{ verticalAlign: "middle" }}
            variant="light"
          >
            <Trans>Default</Trans>
          </Badge>
        ) : canWrite ? (
          <Button
            color="green"
            loading={
              setDefaultMutation.isPending && setDefaultMutation.variables === name
            }
            onClick={() => {
              setDefaultMutation.mutate(name);
            }}
            size="xs"
            variant="light"
          >
            <Trans>set Default</Trans>
          </Button>
        ) : null
    },
    {
      header: <Trans>Realm name</Trans>,
      key: "name",
      render: ({ name }) => (
        <Text fw={500} size="sm">
          {name}
        </Text>
      )
    },
    {
      header: <Trans>resolvers</Trans>,
      key: "resolvers",
      render: ({ name, realm }) =>
        editingRealm === name ? (
          <RealmForm
            idPrefix={`edit-${name}`}
            onChange={setEditSelections}
            resolvers={resolvers}
            selections={editSelections}
          />
        ) : (
          <Stack gap={2}>
            {realm.resolver.map((resolver) => (
              <Text key={resolver.name} size="sm">
                <Anchor href={resolverEditHref(resolver.type, resolver.name)} size="sm">
                  {resolver.name}
                </Anchor>{" "}
                [{resolver.priority ?? ""}] ({resolver.type})
              </Text>
            ))}
          </Stack>
        )
    },
    {
      align: "right",
      header: <Trans>Actions</Trans>,
      key: "actions",
      render: ({ name, realm }) => {
        if (editingRealm === name) {
          return (
            <Group gap="xs" justify="flex-end" wrap="nowrap">
              {canWrite ? (
                <Button
                  disabled={!isRealmSelectionValid(editSelections)}
                  loading={saveMutation.isPending}
                  onClick={() => {
                    saveMutation.mutate({
                      realmName: name,
                      selections: editSelections
                    });
                  }}
                  size="xs"
                >
                  <Trans>Save</Trans>
                </Button>
              ) : null}
              <Button color="red" onClick={cancelEdit} size="xs" variant="light">
                <Trans>Cancel</Trans>
              </Button>
            </Group>
          );
        }

        // The legacy template hid the row actions while another realm was edited.
        if (editingRealm !== null) {
          return null;
        }

        return (
          <Group gap="xs" justify="flex-end" wrap="nowrap">
            {canWrite ? (
              <Button
                leftSection={<IconPencil size={14} />}
                onClick={() => {
                  setEditingRealm(name);
                  setEditSelections(toSelections(realm));
                }}
                size="xs"
                variant="light"
              >
                <Trans>Edit</Trans>
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                color="red"
                leftSection={<IconTrash size={14} />}
                loading={deleteMutation.isPending && deleteMutation.variables === name}
                onClick={() => {
                  requestDelete({
                    identifier: name,
                    onConfirm: () => {
                      deleteMutation.mutate(name);
                    }
                  });
                }}
                size="xs"
                variant="light"
              >
                <Trans>Delete</Trans>
              </Button>
            ) : null}
          </Group>
        );
      }
    }
  ];

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
      <PageHeader title={<Trans>Realms</Trans>} />

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

          <Card flush>
            {realmsQuery.isLoading ? (
              <LoadingIndicator label={<Trans>Loading realms</Trans>} />
            ) : null}
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage={<Trans>No realms defined.</Trans>}
              getRowKey={(row) => row.name}
              id="tablerealms"
              isLoading={realmsQuery.data === undefined}
              minWidth={720}
            />
          </Card>

          {canWrite && editingRealm === null ? (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();

                if (isNewRealmValid) {
                  saveMutation.mutate({
                    realmName: newRealmName,
                    selections: newSelections
                  });
                }
              }}
            >
              <Card
                footer={
                  <Button
                    disabled={!isNewRealmValid}
                    leftSection={<IconPlus size={16} />}
                    loading={saveMutation.isPending}
                    type="submit"
                  >
                    <Trans>Create realm</Trans>
                  </Button>
                }
                title={<Trans>New realm</Trans>}
              >
                <TextInput
                  error={
                    newRealmName !== "" && !isNewRealmNameValid
                      ? t`The resource name must consist of letters, numbers and '_', '-', '.'`
                      : undefined
                  }
                  id="realmname"
                  label={<Trans>Realm name</Trans>}
                  mb="md"
                  onChange={(event) => {
                    setNewRealmName(event.currentTarget.value);
                  }}
                  placeholder={t`new realm`}
                  required
                  value={newRealmName}
                />
                <Text c="dimmed" fw={600} mb={6} size="xs" tt="uppercase">
                  <Trans>resolvers</Trans>
                </Text>
                <RealmForm
                  idPrefix="new"
                  onChange={setNewSelections}
                  resolvers={resolvers}
                  selections={newSelections}
                />
              </Card>
            </form>
          ) : null}
          {dialog}
        </>
      )}
    </SidebarLayout>
  );
}
