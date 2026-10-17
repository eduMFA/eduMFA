import { Stack, Table, ThemeIcon } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";
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
        <Stack align="center" gap="xs">
          <ThemeIcon color="gray" radius="xl" size="lg" variant="light">
            <IconInbox aria-hidden size={18} />
          </ThemeIcon>
          {message}
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}
