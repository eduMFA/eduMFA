import { useLingui } from "@lingui/react/macro";
import { Button, Group, Text } from "@mantine/core";
import { IconFilterOff } from "@tabler/icons-react";

import { ActiveFilterChip } from "./ActiveFilterChip";
import type { AuditFilterName, AuditFilters } from "./auditFilters";

export interface ActiveFilterChipsProps {
  appliedFilters: AuditFilters;
  onReplace: (nextFilters: AuditFilters) => void;
}

/** The applied filters above the table; renders nothing when none is set. */
export function ActiveFilterChips({
  appliedFilters,
  onReplace
}: ActiveFilterChipsProps) {
  const { t } = useLingui();
  const activeFilters = (
    Object.entries(appliedFilters) as [AuditFilterName, string][]
  ).filter(([, value]) => value.length > 0);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <Group
      aria-label={t`Active filters`}
      gap="xs"
      px="md"
      py="sm"
      role="group"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Text c="dimmed" fw={600} size="xs" tt="uppercase">
        {t`Filters`}
      </Text>
      {activeFilters.map(([name, value]) => (
        <ActiveFilterChip
          key={name}
          name={name}
          onRemove={() => {
            onReplace({ ...appliedFilters, [name]: "" });
          }}
          value={value}
        />
      ))}
      <Button
        leftSection={<IconFilterOff size={14} />}
        onClick={() => {
          onReplace({});
        }}
        size="compact-xs"
        variant="subtle"
      >
        {t`Clear all filters`}
      </Button>
    </Group>
  );
}
