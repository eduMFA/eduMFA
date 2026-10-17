import { Trans, useLingui } from "@lingui/react/macro";
import {
  Button,
  Checkbox,
  Code,
  NativeSelect,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput
} from "@mantine/core";
import { IconCalendarTime, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  periodicTaskQueryKeys,
  getPeriodicTask,
  getPeriodicTaskModules,
  getTaskModuleOptions,
  getPeriodicTaskNodes,
  getSelectableNodes,
  type PeriodicTask
} from "@/api/periodicTasks";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { CheckboxPickList } from "@/components/forms/CheckboxPickList";
import { TypedOptionsTable } from "@/components/forms/TypedOptionsTable";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  DefinitionLayout,
  DefinitionPermissionAlert
} from "@/features/config/automation/DefinitionLayout";
import {
  choicesWithCurrent,
  taskRequest,
  readTaskForm,
  optionEntries,
  validOptions,
  validOrder,
  type TaskForm as TaskFormValues
} from "@/features/config/automation/definitionForm";
import {
  taskDefinitionApi,
  useDefinitionMutations
} from "@/features/config/automation/useDefinitionMutations";
import { pushFlash } from "@/lib/flash";

type FormChange = (patch: Partial<TaskFormValues>) => void;

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

/** Create/edit form; `key` on the caller remounts it so state resets per task. */
function TaskForm({ existing }: { existing: PeriodicTask | undefined }) {
  const client = useApiClient();
  const { t } = useLingui();
  const navigate = useNavigate();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "periodictask_write");

  const [form, setForm] = useState(() => readTaskForm(existing));
  const change: FormChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };
  const mutations = useDefinitionMutations(taskDefinitionApi);
  const { dialog, requestDelete } = useDeleteConfirmation();

  // Lookup data; the option specs depend on the chosen task module.
  const nodes = useQuery({
    queryKey: periodicTaskQueryKeys.nodes,
    queryFn: ({ signal }) => getPeriodicTaskNodes(client, signal)
  });
  const modules = useQuery({
    queryKey: periodicTaskQueryKeys.taskModules,
    queryFn: ({ signal }) => getPeriodicTaskModules(client, signal)
  });
  const specs = useQuery({
    queryKey: periodicTaskQueryKeys.options(form.taskmodule),
    queryFn: ({ signal }) => getTaskModuleOptions(client, form.taskmodule, signal),
    enabled: Boolean(form.taskmodule)
  });
  const options = optionEntries(specs.data ?? {}, form.options);

  // Saving is blocked until all lookup data has loaded, so no option is validated against missing specs.
  const ready = nodes.isSuccess && modules.isSuccess && specs.isSuccess;
  const valid =
    ready &&
    form.name.trim() &&
    form.interval.trim() &&
    form.nodes.length > 0 &&
    form.taskmodule &&
    validOrder(form.ordering) &&
    validOptions(options, form.options);

  const finish = () => {
    void navigate("/config/periodictasks/list");
  };

  return (
    <>
      <PageHeader
        title={
          existing ? (
            <Trans>Edit Periodic Task {existing.id}</Trans>
          ) : (
            <Trans>Create a new Periodic Task</Trans>
          )
        }
        actions={
          existing && canWrite ? (
            <Button
              color="red"
              variant="light"
              leftSection={<IconTrash aria-hidden size={16} />}
              disabled={mutations.busy}
              onClick={() => {
                requestDelete({
                  identifier: existing.name,
                  question: (
                    <Trans>Do you really want to delete this periodic task?</Trans>
                  ),
                  onConfirm: () => {
                    mutations.remove.mutate(existing.id, { onSuccess: finish });
                  }
                });
              }}
            >
              <Trans>Delete</Trans>
            </Button>
          ) : null
        }
      />

      <ErrorAlert
        error={nodes.error ?? modules.error ?? specs.error ?? mutations.error}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canWrite && valid && !mutations.busy)
            mutations.save.mutate(taskRequest(form, existing?.id), {
              onSuccess: () => {
                pushFlash(t`Periodic task saved.`, "info");
                finish();
              }
            });
        }}
      >
        <fieldset
          disabled={!canWrite || mutations.busy}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <TaskGeneralCard
            form={form}
            onChange={change}
            nodes={getSelectableNodes(nodes.data ?? [])}
            modules={modules.data ?? []}
          />

          {specs.isLoading ? <LoadingIndicator /> : null}

          {specs.data ? (
            <Card title={<Trans>Options</Trans>}>
              <TypedOptionsTable
                idPrefix="task-option"
                options={options}
                values={form.options}
                onChange={(name, value) => {
                  change({ options: { ...form.options, [name]: value } });
                }}
              />
            </Card>
          ) : null}

          {canWrite ? (
            <Button
              type="submit"
              disabled={!valid}
              loading={mutations.save.isPending}
              leftSection={<IconDeviceFloppy aria-hidden size={16} />}
            >
              <Trans>Save Periodic Task Definition</Trans>
            </Button>
          ) : null}
        </fieldset>
      </form>

      {existing ? <TaskLastRunsCard task={existing} /> : null}

      {dialog}
    </>
  );
}

/** Name, status, schedule, nodes, retry flag, order and task module of a task. */
function TaskGeneralCard({
  form,
  onChange,
  nodes,
  modules
}: {
  form: TaskFormValues;
  onChange: FormChange;
  nodes: Parameters<typeof CheckboxPickList>[0]["options"];
  modules: string[];
}) {
  return (
    <Card>
      <Stack>
        <TextInput
          label={<Trans>Description</Trans>}
          required
          value={form.name}
          onChange={(event) => {
            onChange({ name: event.currentTarget.value });
          }}
        />

        <Checkbox
          label={<Trans>Active</Trans>}
          checked={form.active}
          onChange={(event) => {
            onChange({ active: event.currentTarget.checked });
          }}
        />

        <TextInput
          label={<Trans>Interval</Trans>}
          required
          leftSection={<IconCalendarTime aria-hidden size={16} />}
          description={
            <Trans>
              Use crontab notation: minute, hour, day of month, month, day of week.
            </Trans>
          }
          placeholder="*/10 * * * *"
          value={form.interval}
          onChange={(event) => {
            onChange({ interval: event.currentTarget.value });
          }}
        />
        <Text size="sm" c="dimmed">
          <Code>*/10 * * * *</Code> <Trans>Every ten minutes</Trans>
          <br />
          <Code>5 10 * * *</Code> <Trans>Every day at 10:05</Trans>
        </Text>

        <CheckboxPickList
          id="task-nodes"
          label={<Trans>Nodes</Trans>}
          required
          options={nodes}
          selected={form.nodes}
          onChange={(selected) => {
            onChange({ nodes: selected });
          }}
        />

        <Checkbox
          label={<Trans>Retry If Failed</Trans>}
          checked={form.retry_if_failed}
          onChange={(event) => {
            onChange({ retry_if_failed: event.currentTarget.checked });
          }}
        />

        <NumberInput
          label={<Trans>Order</Trans>}
          min={0}
          allowDecimal={false}
          value={form.ordering}
          onChange={(ordering) => {
            onChange({ ordering });
          }}
        />

        <NativeSelect
          label={<Trans>Taskmodule</Trans>}
          required
          data={choicesWithCurrent(modules, form.taskmodule)}
          value={form.taskmodule}
          onChange={(event) => {
            // Options are module specific, so they are dropped on module change.
            onChange({ taskmodule: event.currentTarget.value, options: {} });
          }}
        />
      </Stack>
    </Card>
  );
}

/** Read-only list of the last run per node and the time of the last definition update. */
function TaskLastRunsCard({ task }: { task: PeriodicTask }) {
  const runs = Object.entries(task.last_runs);

  return (
    <Card title={<Trans>Recorded Last Runs</Trans>}>
      {runs.length ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Trans>Node</Trans>
              </Table.Th>
              <Table.Th>
                <Trans>Last Run</Trans>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {runs.map(([node, timestamp]) => (
              <Table.Tr key={node}>
                <Table.Td>{node}</Table.Td>
                <Table.Td>{timestamp}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed">
          <Trans>(none)</Trans>
        </Text>
      )}

      <Text size="sm" mt="md">
        <Trans>Last Definition Update</Trans>: {task.last_update}
      </Text>
    </Card>
  );
}
