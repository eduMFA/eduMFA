import { Trans } from "@lingui/react/macro";
import { Group, Loader, Text } from "@mantine/core";
import type { ReactNode } from "react";

export interface LoadingIndicatorProps {
  label?: ReactNode;
}

export function LoadingIndicator({
  label = <Trans>Loading</Trans>
}: LoadingIndicatorProps) {
  return (
    <Group c="dimmed" gap="xs" my="sm" px="md" role="status">
      <Loader size="xs" />
      <Text size="sm">{label}</Text>
    </Group>
  );
}
