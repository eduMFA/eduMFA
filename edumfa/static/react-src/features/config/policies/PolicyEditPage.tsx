import { Trans, useLingui } from "@lingui/react/macro";
import {
  IconDeviceFloppy,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash
} from "@tabler/icons-react";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  NativeSelect,
  NumberInput,
  SimpleGrid,
  Stack,
  TextInput
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PolicyActionsEditor } from "./PolicyActionsEditor";
import { PolicyConditionsEditor } from "./PolicyConditionsEditor";
import {
  buildPolicyRequest,
  isPolicyFormValid,
  isPolicyNameValid,
  readPolicyForm,
  type PolicyFormValues
} from "./policyForm";
import { PolicySidebar } from "./PolicySidebar";
import { PolicyTemplatePicker } from "./PolicyTemplatePicker";
import { usePolicyMutations } from "./usePolicyMutations";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms, getResolvers } from "@/api/config";
import {
  getPolicy,
  getPolicyAdminRealms,
  getPolicyConditionDefinitions,
  getPolicyDefinitions,
  getPolicyNodes,
  policyQueryKeys,
  type Policy,
  type PolicyConditionDefinitions,
  type PolicyDefinitions
} from "@/api/policies";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { CheckboxPickList } from "@/components/forms/CheckboxPickList";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { notify } from "@/lib/notify";

export function PolicyEditPage() {
  const { policyname = "" } = useParams();
  const apiClient = useApiClient();
  const { isAuthenticated, rights } = useAuth();
  const canOpen = hasRight(rights, policyname ? "policyread" : "policywrite");
  const enabled = isAuthenticated && canOpen;
  const policyQuery = useQuery({
    enabled: enabled && !!policyname,
    queryFn: ({ signal }) => getPolicy(apiClient, policyname, signal),
    queryKey: policyQueryKeys.detail(policyname)
  });
  const definitionsQuery = useQuery({
    enabled,
    queryFn: ({ signal }) => getPolicyDefinitions(apiClient, signal),
    queryKey: policyQueryKeys.definitions
  });
  const conditionsQuery = useQuery({
    enabled,
    queryFn: ({ signal }) => getPolicyConditionDefinitions(apiClient, signal),
    queryKey: policyQueryKeys.conditions
  });
  const policy = policyQuery.data?.find((item) => item.name === policyname);
  const notFound = !!policyname && policyQuery.isSuccess && !policy;
  const loading =
    definitionsQuery.isLoading || conditionsQuery.isLoading || policyQuery.isLoading;

  return (
    <SidebarLayout sidebar={<PolicySidebar active={policyname ? "edit" : "add"} />}>
      <PageHeader
        title={
          policyname ? (
            <Trans>Edit Policy {policyname}</Trans>
          ) : (
            <Trans>Create a new Policy</Trans>
          )
        }
      />
      {!isAuthenticated ? (
        <LoginRequiredAlert />
      ) : !canOpen ? (
        <Alert color="yellow" role="alert">
          <Trans>You do not have permission to open this policy page.</Trans>
        </Alert>
      ) : (
        <>
          <ErrorAlert
            error={policyQuery.error ?? definitionsQuery.error ?? conditionsQuery.error}
          />
          {loading ? <LoadingIndicator /> : null}
          {notFound ? (
            <Alert color="yellow" role="alert">
              <Trans>Policy {policyname} was not found.</Trans>
            </Alert>
          ) : null}
          {definitionsQuery.data && conditionsQuery.data && (!policyname || policy) ? (
            <PolicyEditor
              key={policyname}
              policy={policy}
              definitions={definitionsQuery.data}
              conditionDefinitions={conditionsQuery.data}
            />
          ) : null}
        </>
      )}
    </SidebarLayout>
  );
}

function PolicyEditor({
  policy,
  definitions,
  conditionDefinitions
}: {
  policy: Policy | undefined;
  definitions: PolicyDefinitions;
  conditionDefinitions: PolicyConditionDefinitions;
}) {
  const { t } = useLingui();
  const apiClient = useApiClient();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "policywrite");
  const canDelete = hasRight(rights, "policydelete");
  const navigate = useNavigate();
  const [form, setForm] = useState(() => readPolicyForm(policy));
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const mutations = usePolicyMutations();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const realms = useQuery({
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const resolvers = useQuery({
    enabled: hasRight(rights, "resolverread"),
    queryFn: ({ signal }) => getResolvers(apiClient, undefined, signal),
    queryKey: configQueryKeys.resolvers()
  });
  const adminRealms = useQuery({
    enabled: form.scope === "admin",
    queryFn: ({ signal }) => getPolicyAdminRealms(apiClient, signal),
    queryKey: policyQueryKeys.adminRealms
  });
  const nodes = useQuery({
    queryFn: ({ signal }) => getPolicyNodes(apiClient, signal),
    queryKey: policyQueryKeys.nodes
  });
  const update = (changes: Partial<PolicyFormValues>) => {
    setForm((previous) => ({ ...previous, ...changes }));
  };
  const valid = isPolicyFormValid(form, definitions);
  const scopes = [...new Set([form.scope, ...Object.keys(definitions)])];

  return (
    <>
      {policy ? (
        <Group mb="md">
          {canWrite ? (
            <Button
              type="button"
              leftSection={
                form.active ? (
                  <IconPlayerPause aria-hidden size={16} />
                ) : (
                  <IconPlayerPlay aria-hidden size={16} />
                )
              }
              variant="light"
              disabled={mutations.busy}
              onClick={() => {
                mutations.toggle.mutate(
                  { name: policy.name, active: !form.active },
                  {
                    onSuccess: () => {
                      update({ active: !form.active });
                    }
                  }
                );
              }}
            >
              {form.active ? <Trans>Disable</Trans> : <Trans>Enable</Trans>}
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              color="red"
              leftSection={<IconTrash aria-hidden size={16} />}
              variant="light"
              disabled={mutations.busy}
              onClick={() => {
                requestDelete({
                  identifier: policy.name,
                  question: <Trans>Do you really want to delete this policy?</Trans>,
                  onConfirm: () => {
                    mutations.remove.mutate(policy.name, {
                      onSuccess: () => {
                        void navigate("/config/policies/list");
                      }
                    });
                  }
                });
              }}
            >
              <Trans>Delete</Trans>
            </Button>
          ) : null}
        </Group>
      ) : null}
      <ErrorAlert
        error={mutations.save.error ?? mutations.toggle.error ?? mutations.remove.error}
      />
      <ErrorAlert
        error={realms.error ?? resolvers.error ?? adminRealms.error ?? nodes.error}
      />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (canWrite && valid && !mutations.busy && !loadingTemplate)
            mutations.save.mutate(
              { name: form.name, request: buildPolicyRequest(form) },
              {
                onSuccess: () => {
                  notify(t`Policy saved.`, "success");
                  void navigate("/config/policies/list");
                }
              }
            );
        }}
      >
        <fieldset
          disabled={!canWrite || mutations.busy || loadingTemplate}
          style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
        >
          <Card>
            <Stack>
              <TextInput
                label={<Trans>Policy Name</Trans>}
                value={form.name}
                required
                autoFocus
                onChange={(event) => {
                  update({ name: event.currentTarget.value });
                }}
                error={
                  form.name && !isPolicyNameValid(form.name)
                    ? t`Use letters, numbers, spaces, underscores, dots or hyphens. Reserved policy names are not allowed.`
                    : undefined
                }
                description={
                  policy ? (
                    <Trans>
                      If you change the name of the policy, it will create a new policy
                      with the new name!
                    </Trans>
                  ) : undefined
                }
              />
              {!policy && canWrite ? (
                <PolicyTemplatePicker
                  onBusyChange={setLoadingTemplate}
                  onApply={(template) => {
                    setForm(readPolicyForm(template));
                  }}
                />
              ) : null}
              <NativeSelect
                label={<Trans>Scope</Trans>}
                data={scopes}
                value={form.scope}
                required
                onChange={(event) => {
                  update({ scope: event.currentTarget.value, actions: {} });
                }}
              />
              <NumberInput
                label={<Trans>Priority</Trans>}
                value={form.priority}
                allowDecimal={false}
                min={1}
                required
                onChange={(priority) => {
                  update({ priority });
                }}
                description={
                  <Trans>
                    In case of conflicting policies, the policy with the lowest priority
                    number will take precedence.
                  </Trans>
                }
              />
              {!policy ? (
                <Checkbox
                  label={<Trans>Active</Trans>}
                  checked={form.active}
                  onChange={(event) => {
                    update({ active: event.currentTarget.checked });
                  }}
                />
              ) : null}
            </Stack>
          </Card>
          <Card title={<Trans>Condition</Trans>}>
            <Stack>
              {form.scope === "admin" ? (
                <>
                  <CheckboxPickList
                    id="policy-adminrealm"
                    label={<Trans>Admin-Realm</Trans>}
                    options={adminRealms.data ?? []}
                    selected={form.adminrealm}
                    onChange={(adminrealm) => {
                      update({ adminrealm });
                    }}
                    columns={2}
                  />
                  <TextInput
                    label={<Trans>Admin</Trans>}
                    value={form.adminuser}
                    onChange={(event) => {
                      update({ adminuser: event.currentTarget.value });
                    }}
                    placeholder="admin, superuser"
                  />
                </>
              ) : null}
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <CheckboxPickList
                  id="policy-realm"
                  label={<Trans>User-Realm</Trans>}
                  options={Object.keys(realms.data ?? {})}
                  selected={form.realm}
                  onChange={(realm) => {
                    update({ realm });
                  }}
                  filterable
                />
                <CheckboxPickList
                  id="policy-resolver"
                  label={<Trans>User-Resolver</Trans>}
                  options={Object.keys(resolvers.data ?? {})}
                  selected={form.resolver}
                  onChange={(resolver) => {
                    update({ resolver });
                  }}
                  filterable
                />
              </SimpleGrid>
              <Checkbox
                label={
                  <Trans>
                    Check all possible resolvers of a user to match the resolver in this
                    policy.
                  </Trans>
                }
                checked={form.checkAllResolvers}
                onChange={(event) => {
                  update({ checkAllResolvers: event.currentTarget.checked });
                }}
              />
              <TextInput
                label={<Trans>User</Trans>}
                value={form.user}
                placeholder="userA, userB"
                onChange={(event) => {
                  update({ user: event.currentTarget.value });
                }}
              />
              <CheckboxPickList
                id="policy-node"
                label={<Trans>eduMFA Node</Trans>}
                options={nodes.data ?? []}
                selected={form.edumfanode}
                onChange={(edumfanode) => {
                  update({ edumfanode });
                }}
                columns={2}
              />
              <TextInput
                label={<Trans>Client</Trans>}
                value={form.client}
                placeholder="10.0.0.0/8, !10.0.0.124"
                onChange={(event) => {
                  update({ client: event.currentTarget.value });
                }}
              />
              <TextInput
                label={<Trans>Valid time</Trans>}
                value={form.time}
                placeholder="Mon-Fri: 9-18, Sat: 10-15"
                onChange={(event) => {
                  update({ time: event.currentTarget.value });
                }}
              />
            </Stack>
          </Card>
          <Card title={<Trans>Additional conditions</Trans>}>
            <PolicyConditionsEditor
              conditions={form.conditions}
              definitions={conditionDefinitions}
              onChange={(conditions) => {
                update({ conditions });
              }}
            />
          </Card>
          {form.scope ? (
            <Card title={<Trans>Action</Trans>}>
              <PolicyActionsEditor
                key={form.scope}
                scope={form.scope}
                definitions={definitions[form.scope] ?? {}}
                actions={form.actions}
                onChange={(actions) => {
                  update({ actions });
                }}
              />
            </Card>
          ) : null}
          {canWrite ? (
            <Group justify="center">
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy aria-hidden size={16} />}
                disabled={!valid || mutations.busy}
                loading={mutations.save.isPending}
              >
                <Trans>Save Policy</Trans>
              </Button>
            </Group>
          ) : null}
        </fieldset>
      </form>
      {dialog}
    </>
  );
}
