import { Trans } from "@lingui/react/macro";
import { Table, Text } from "@mantine/core";

import type { PeriodicTask } from "@/api/periodicTasks";
import { Card } from "@/components/layout/Card";

/** Read-only list of the last run per node and the time of the last definition update. */
export function TaskLastRunsCard({ task }: { task: PeriodicTask }) {
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
