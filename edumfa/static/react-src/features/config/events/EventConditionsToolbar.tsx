import { useLingui } from "@lingui/react/macro";
import { Button, Checkbox, Group, TextInput } from "@mantine/core";
import { IconFilter, IconFold, IconArrowsVertical } from "@tabler/icons-react";

/** Filter input, "selected only" switch and the open/close all group buttons. */
export function EventConditionsToolbar({
  filter,
  onCloseAll,
  onFilterChange,
  onOpenAll,
  onSelectedOnlyChange,
  selectedOnly
}: {
  filter: string;
  onCloseAll: () => void;
  onFilterChange: (filter: string) => void;
  onOpenAll: () => void;
  onSelectedOnlyChange: (selectedOnly: boolean) => void;
  selectedOnly: boolean;
}) {
  const { t } = useLingui();
  return (
    <Group>
      <TextInput
        label={t`Filter conditions`}
        leftSection={<IconFilter aria-hidden size={16} />}
        value={filter}
        onChange={(event) => {
          onFilterChange(event.currentTarget.value);
        }}
      />
      <Checkbox
        label={t`Show selected conditions only`}
        checked={selectedOnly}
        onChange={(event) => {
          onSelectedOnlyChange(event.currentTarget.checked);
        }}
      />
      <Button
        variant="subtle"
        leftSection={<IconArrowsVertical aria-hidden size={16} />}
        onClick={onOpenAll}
      >
        {t`Open all groups`}
      </Button>
      <Button
        variant="subtle"
        leftSection={<IconFold aria-hidden size={16} />}
        onClick={onCloseAll}
      >
        {t`Close all groups`}
      </Button>
    </Group>
  );
}
