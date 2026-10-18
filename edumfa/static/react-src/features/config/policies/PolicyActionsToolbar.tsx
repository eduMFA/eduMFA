import { Trans, useLingui } from "@lingui/react/macro";
import { IconFilter, IconFold, IconArrowsVertical } from "@tabler/icons-react";
import { Button, Checkbox, Group, TextInput } from "@mantine/core";

/** Filter input, "selected only" switch and the open/close all group buttons. */
export function PolicyActionsToolbar({
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
        label={t`Filter actions`}
        leftSection={<IconFilter aria-hidden size={16} />}
        value={filter}
        onChange={(event) => {
          onFilterChange(event.currentTarget.value);
        }}
      />
      <Checkbox
        checked={selectedOnly}
        label={<Trans>Show selected actions only</Trans>}
        onChange={(event) => {
          onSelectedOnlyChange(event.currentTarget.checked);
        }}
      />
      <Button
        leftSection={<IconArrowsVertical aria-hidden size={16} />}
        type="button"
        variant="subtle"
        onClick={onOpenAll}
      >
        <Trans>Open all groups</Trans>
      </Button>
      <Button
        leftSection={<IconFold aria-hidden size={16} />}
        type="button"
        variant="subtle"
        onClick={onCloseAll}
      >
        <Trans>Close all groups</Trans>
      </Button>
    </Group>
  );
}
