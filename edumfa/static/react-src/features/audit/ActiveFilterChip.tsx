import { useLingui } from "@lingui/react/macro";
import { ActionIcon, Badge } from "@mantine/core";
import { IconX } from "@tabler/icons-react";

import { getFilterLabel } from "./auditColumns";
import type { AuditFilterName } from "./auditFilters";

export interface ActiveFilterChipProps {
  name: AuditFilterName;
  onRemove: () => void;
  value: string;
}

/** One applied filter as "label: value" with a remove button. */
export function ActiveFilterChip({ name, onRemove, value }: ActiveFilterChipProps) {
  const { t } = useLingui();
  const describedValue = name === "success" ? (value === "1" ? t`yes` : t`no`) : value;

  return (
    <Badge
      data-chip={name}
      rightSection={
        <ActionIcon
          aria-label={t`Remove filter ${name}`}
          onClick={onRemove}
          size="xs"
          variant="transparent"
        >
          <IconX size={12} />
        </ActionIcon>
      }
      size="lg"
      tt="none"
      variant="light"
    >
      {getFilterLabel(name)}: {describedValue}
    </Badge>
  );
}
