import { Title } from "@mantine/core";
import { type ReactNode } from "react";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Title mb="xs" mt="md" order={4} size="h6">
      {children}
    </Title>
  );
}
