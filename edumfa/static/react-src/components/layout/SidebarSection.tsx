import { Text } from "@mantine/core";
import type { ReactNode } from "react";

/** Small uppercase heading between sidebar navigation groups. */
export function SidebarSection({ children }: { children: ReactNode }) {
  return (
    <Text c="dimmed" fw={600} pt="sm" px="sm" size="xs" tt="uppercase">
      {children}
    </Text>
  );
}
