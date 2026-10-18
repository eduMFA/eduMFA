import { useLingui } from "@lingui/react/macro";
import { Table, Text } from "@mantine/core";

import type { PeriodicTask } from "@/api/periodicTasks";
import { Card } from "@/components/layout/Card";

/** Read-only list of the last run per node and the time of the last definition update. */
export function TaskLastRunsCard({ task }: { task: PeriodicTask }) {
  const { t } = useLingui();

  const runs = Object.entries(task.last_runs);

  return (
    <Card title={t`Recorded Last Runs`}>
      {runs.length ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t`Node`}</Table.Th>
              <Table.Th>{t`Last Run`}</Table.Th>
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
        <Text c="dimmed">{t`(none)`}</Text>
      )}

      <Text size="sm" mt="md">
        {t`Last Definition Update`}: {task.last_update}
      </Text>
    </Card>
  );
}
