import { Table } from "@mantine/core";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  colSpan?: number;
  message: ReactNode;
}

/** Placeholder row for an empty Mantine table body. */
export function EmptyState({ colSpan = 3, message }: EmptyStateProps) {
  return (
    <Table.Tr>
      <Table.Td c="dimmed" colSpan={colSpan} py="xl" ta="center">
        {message}
      </Table.Td>
    </Table.Tr>
  );
}
