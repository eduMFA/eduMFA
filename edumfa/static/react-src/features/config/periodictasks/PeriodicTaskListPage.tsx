import { useLingui } from "@lingui/react/macro";
import { getPeriodicTasks } from "@/api/periodicTasks";
import { DefinitionList } from "@/features/config/automation/DefinitionList";
import { taskRequest, readTaskForm } from "@/features/config/automation/definitionForm";
import { taskDefinitionApi } from "@/features/config/automation/useDefinitionMutations";

export function PeriodicTaskListPage() {
  const { t } = useLingui();

  return (
    <DefinitionList
      kind="periodictasks"
      api={taskDefinitionApi}
      load={getPeriodicTasks}
      request={(task) => taskRequest(readTaskForm(task), task.id)}
      columns={[
        {
          key: "interval",
          header: t`Interval`,
          render: (task) => task.interval
        },
        {
          key: "taskmodule",
          header: t`Taskmodule`,
          render: (task) => task.taskmodule
        },
        {
          key: "nodes",
          header: t`Nodes`,
          render: (task) => task.nodes.join(", ")
        },
        {
          key: "options",
          header: t`Options`,
          render: (task) =>
            Object.entries(task.options)
              .map(([key, value]) => `${key}=${value}`)
              .join(", ")
        }
      ]}
    />
  );
}
