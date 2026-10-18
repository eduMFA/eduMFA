import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { TaskFormHeader } from "./TaskFormHeader";
import { TaskGeneralCard } from "./TaskGeneralCard";
import { TaskLastRunsCard } from "./TaskLastRunsCard";
import { useTaskForm } from "./useTaskForm";
import { getSelectableNodes, type PeriodicTask } from "@/api/periodicTasks";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { TypedOptionsTable } from "@/components/forms/TypedOptionsTable";
import { Card } from "@/components/layout/Card";

/** Create/edit form; `key` on the caller remounts it so state resets per task. */
export function TaskForm({ existing }: { existing: PeriodicTask | undefined }) {
  const { t } = useLingui();

  const { canWrite, change, finish, form, lookups, mutations, options, submit, valid } =
    useTaskForm(existing);
  const { modules, nodes, specs } = lookups;
  const { dialog, requestDelete } = useDeleteConfirmation();

  return (
    <>
      <TaskFormHeader
        canWrite={canWrite}
        existing={existing}
        mutations={mutations}
        requestDelete={requestDelete}
        onDeleted={finish}
      />

      <ErrorAlert error={lookups.error ?? mutations.error} />

      <form onSubmit={submit}>
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
            <Card title={t`Options`}>
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
              {t`Save Periodic Task Definition`}
            </Button>
          ) : null}
        </fieldset>
      </form>

      {existing ? <TaskLastRunsCard task={existing} /> : null}

      {dialog}
    </>
  );
}
