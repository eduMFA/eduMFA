import { useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, NumberInput, Stack, TextInput } from "@mantine/core";

import { TaskIntervalField } from "./TaskIntervalField";
import type { TaskFormChange } from "./types";
import { CheckboxPickList } from "@/components/forms/CheckboxPickList";
import { Card } from "@/components/layout/Card";
import {
  choicesWithCurrent,
  type TaskForm as TaskFormValues
} from "@/features/config/automation/definitionForm";

/** Name, status, schedule, nodes, retry flag, order and task module of a task. */
export function TaskGeneralCard({
  form,
  onChange,
  nodes,
  modules
}: {
  form: TaskFormValues;
  onChange: TaskFormChange;
  nodes: Parameters<typeof CheckboxPickList>[0]["options"];
  modules: string[];
}) {
  const { t } = useLingui();

  return (
    <Card>
      <Stack>
        <TextInput
          label={t`Description`}
          required
          value={form.name}
          onChange={(event) => {
            onChange({ name: event.currentTarget.value });
          }}
        />

        <Checkbox
          label={t`Active`}
          checked={form.active}
          onChange={(event) => {
            onChange({ active: event.currentTarget.checked });
          }}
        />

        <TaskIntervalField
          value={form.interval}
          onChange={(interval) => {
            onChange({ interval });
          }}
        />

        <CheckboxPickList
          id="task-nodes"
          label={t`Nodes`}
          required
          options={nodes}
          selected={form.nodes}
          onChange={(selected) => {
            onChange({ nodes: selected });
          }}
        />

        <Checkbox
          label={t`Retry If Failed`}
          checked={form.retry_if_failed}
          onChange={(event) => {
            onChange({ retry_if_failed: event.currentTarget.checked });
          }}
        />

        <NumberInput
          label={t`Order`}
          min={0}
          allowDecimal={false}
          value={form.ordering}
          onChange={(ordering) => {
            onChange({ ordering });
          }}
        />

        <NativeSelect
          label={t`Taskmodule`}
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
