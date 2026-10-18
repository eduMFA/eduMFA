import { useLingui } from "@lingui/react/macro";
import { Table } from "@mantine/core";
import dayjs from "dayjs";

import type { AuditEntry } from "@/api/audit";
import { Card } from "@/components/layout/Card";

export interface AdministrationCardProps {
  entries: AuditEntry[];
}

/** The most recent administrative requests from the audit log. */
export function AdministrationCard({ entries }: AdministrationCardProps) {
  const { t } = useLingui();

  return (
    <Card flush title={t`Administration`}>
      {/* Paths like POST /policy/<name> do not wrap; the table scrolls inside the card. */}
      <Table.ScrollContainer minWidth={480}>
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t`Date`}</Table.Th>
              <Table.Th>{t`Administrator`}</Table.Th>
              <Table.Th>{t`Action`}</Table.Th>
              <Table.Th>{t`Detail`}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map((entry) => (
              <Table.Tr key={entry.number}>
                <Table.Td style={{ whiteSpace: "nowrap" }}>
                  {formatDashboardDate(entry.date)}
                </Table.Td>
                <Table.Td>{entry.administrator}</Table.Td>
                <Table.Td>{entry.action}</Table.Td>
                <Table.Td>{entry.action_detail}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}

/** Like the legacy `date: "y-MM-d HH:mm"` filter, without seconds. */
function formatDashboardDate(value: string): string {
  const date = dayjs(value);

  return date.isValid() ? date.format("YYYY-MM-DD HH:mm") : value;
}
