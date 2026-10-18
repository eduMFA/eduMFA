import { Table } from "@mantine/core";
import type { ReactNode } from "react";

export interface StatRowProps {
  children: ReactNode;
  label: ReactNode;
  name: string;
}

/** A label/value row of the dashboard tables; `name` marks the value cell. */
export function StatRow({ children, label, name }: StatRowProps) {
  return (
    <Table.Tr>
      <Table.Td fw={600}>{label}</Table.Td>
      <Table.Td data-field={name} ta="right">
        {children}
      </Table.Td>
    </Table.Tr>
  );
}
