import { useLingui } from "@lingui/react/macro";
import { Group, Loader, Text } from "@mantine/core";
import type { ReactNode } from "react";

export interface LoadingIndicatorProps {
  label?: ReactNode;
}

export function LoadingIndicator({ label }: LoadingIndicatorProps) {
  const { t } = useLingui();

  return (
    <Group c="dimmed" gap="xs" my="sm" px="md" role="status">
      <Loader size="xs" />
      <Text size="sm">{label ?? t`Loading`}</Text>
    </Group>
  );
}
