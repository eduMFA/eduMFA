import { Table } from "@mantine/core";

import type { ClientApplication } from "@/api/component";
import { formatLegacyDate } from "@/lib/dates";

export interface ClientTypeRowsProps {
  applicationType: string;
  clients: ClientApplication[];
}

/** The rows of one application type; the first row carries the type cell for all of them. */
export function ClientTypeRows({ applicationType, clients }: ClientTypeRowsProps) {
  return (
    <>
      {clients.map((client, index) => (
        <Table.Tr
          key={`${applicationType}-${client.ip}-${client.lastseen ?? String(index)}`}
        >
          {index === 0 ? (
            <Table.Td fw={600} rowSpan={clients.length}>
              {applicationType}
            </Table.Td>
          ) : null}
          <Table.Td>{client.ip}</Table.Td>
          <Table.Td>
            {client.hostname ? `${client.hostname} - ` : ""}
            {formatLegacyDate(client.lastseen)}
          </Table.Td>
        </Table.Tr>
      ))}
    </>
  );
}
