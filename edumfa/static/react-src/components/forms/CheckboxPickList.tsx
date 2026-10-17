import { useLingui } from "@lingui/react/macro";
import {
  Box,
  Checkbox,
  CloseButton,
  Input,
  ScrollArea,
  SimpleGrid,
  Text,
  TextInput,
  VisuallyHidden
} from "@mantine/core";
import { useState, type ReactNode } from "react";

export interface CheckboxPickListProps {
  /** Grid columns on wider screens; phones always get one. */
  columns?: number | undefined;
  description?: ReactNode;
  disabled?: boolean | undefined;
  /** Offers a filter input above the entries, for long lists. */
  filterable?: boolean | undefined;
  id: string;
  label: ReactNode;
  /** Keeps the label for assistive technology only, e.g. inside a labelled table row. */
  labelHidden?: boolean | undefined;
  /** Height limit of the scrolling entry area in px. */
  maxHeight?: number | undefined;
  onChange: (selected: string[]) => void;
  options: readonly string[];
  required?: boolean | undefined;
  selected: readonly string[];
}

/**
 * Multi-selection as a labelled group of checkboxes, replacing the legacy
 * `isteven-multi-select` dropdowns. Entries the value holds but the option
 * list lacks are listed as well, so saving does not silently drop them.
 * The selection keeps the order of the option list.
 */
export function CheckboxPickList({
  columns = 1,
  description,
  disabled = false,
  filterable = false,
  id,
  label,
  labelHidden = false,
  maxHeight = 240,
  onChange,
  options,
  required = false,
  selected
}: CheckboxPickListProps) {
  const { t } = useLingui();
  const [filter, setFilter] = useState("");
  const labelId = `${id}-label`;
  const entries = [...options, ...selected.filter((entry) => !options.includes(entry))];
  const needle = filter.trim().toLowerCase();
  const visibleEntries = needle
    ? entries.filter((entry) => entry.toLowerCase().includes(needle))
    : entries;

  const toggle = (entry: string, checked: boolean) => {
    onChange(
      checked
        ? entries.filter(
            (candidate) => candidate === entry || selected.includes(candidate)
          )
        : selected.filter((candidate) => candidate !== entry)
    );
  };

  const labelElement = (
    <Input.Label id={labelId} labelElement="div" required={required}>
      {label}
    </Input.Label>
  );

  return (
    <Box aria-labelledby={labelId} id={id} mb="md" role="group">
      {labelHidden ? <VisuallyHidden>{labelElement}</VisuallyHidden> : labelElement}
      {filterable ? (
        <TextInput
          aria-label={t`Filter entries`}
          mb="xs"
          onChange={(event) => {
            setFilter(event.currentTarget.value);
          }}
          placeholder={t`filter...`}
          rightSection={
            filter ? (
              <CloseButton
                aria-label={t`Clear filter`}
                onClick={() => {
                  setFilter("");
                }}
                size="sm"
              />
            ) : null
          }
          size="xs"
          value={filter}
        />
      ) : null}
      <ScrollArea.Autosize mah={maxHeight} type="auto">
        <SimpleGrid cols={{ base: 1, sm: columns }} spacing="md" verticalSpacing={6}>
          {visibleEntries.map((entry) => (
            <Checkbox
              checked={selected.includes(entry)}
              disabled={disabled}
              key={entry}
              label={entry}
              onChange={(event) => {
                toggle(entry, event.currentTarget.checked);
              }}
              size="sm"
            />
          ))}
        </SimpleGrid>
        {visibleEntries.length === 0 ? (
          <Text c="dimmed" size="sm">
            {entries.length === 0
              ? t`No entries available.`
              : t`No entries match the filter.`}
          </Text>
        ) : null}
      </ScrollArea.Autosize>
      {description ? <Input.Description mt={4}>{description}</Input.Description> : null}
    </Box>
  );
}
