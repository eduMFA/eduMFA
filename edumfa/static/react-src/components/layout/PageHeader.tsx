import { Group, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  actions?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}

export function PageHeader({ actions, subtitle, title }: PageHeaderProps) {
  return (
    <Group
      align="flex-start"
      component="header"
      justify="space-between"
      mb="lg"
      wrap="wrap"
    >
      <div>
        <Title order={2} size="h3">
          {title}
        </Title>
        {subtitle ? (
          <Text c="dimmed" component="p" m={0} mt={4} size="sm">
            {subtitle}
          </Text>
        ) : null}
      </div>
      {actions ? <Group gap="xs">{actions}</Group> : null}
    </Group>
  );
}
