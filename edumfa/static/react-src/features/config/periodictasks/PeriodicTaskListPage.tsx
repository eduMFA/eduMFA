import { Trans } from "@lingui/react/macro";
import { getPeriodicTasks } from "@/api/periodicTasks";
import { DefinitionList } from "@/features/config/automation/DefinitionList";
import { taskRequest, readTaskForm } from "@/features/config/automation/definitionForm";
import { taskDefinitionApi } from "@/features/config/automation/useDefinitionMutations";

export function PeriodicTaskListPage() {
  return (
    <DefinitionList
      kind="periodictasks"
      api={taskDefinitionApi}
      load={getPeriodicTasks}
      request={(task) => taskRequest(readTaskForm(task), task.id)}
      columns={[
        {
          key: "interval",
          header: <Trans>Interval</Trans>,
          render: (task) => task.interval
        },
        {
          key: "taskmodule",
          header: <Trans>Taskmodule</Trans>,
          render: (task) => task.taskmodule
        },
        {
          key: "nodes",
          header: <Trans>Nodes</Trans>,
          render: (task) => task.nodes.join(", ")
        },
        {
          key: "options",
          header: <Trans>Options</Trans>,
          render: (task) =>
            Object.entries(task.options)
              .map(([key, value]) => `${key}=${value}`)
              .join(", ")
        }
      ]}
    />
  );
}
