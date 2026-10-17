import { Trans, useLingui } from "@lingui/react/macro";
import { Accordion, Button, Checkbox, Group, Stack, TextInput } from "@mantine/core";
import { IconFilter, IconFold, IconArrowsVertical } from "@tabler/icons-react";
import { useState } from "react";
import type { EventHandlerConditions } from "@/api/events";
import { TypedOptionInput } from "@/components/forms/TypedOptionInput";
import {
  optionEntries,
  type DefinitionValues
} from "@/features/config/automation/definitionForm";

/** Filterable, grouped list of handler conditions; a condition is active once it has an entry in `values`. */
export function EventConditionsEditor({
  definitions,
  values,
  onChange
}: {
  definitions: EventHandlerConditions;
  values: DefinitionValues;
  onChange: (values: DefinitionValues) => void;
}) {
  const { t } = useLingui();
  const [filter, setFilter] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  // Conditions use `desc`, the shared option helpers expect `description`.
  const entries = optionEntries(
    Object.fromEntries(
      Object.entries(definitions).map(([name, spec]) => [
        name,
        { ...spec, description: spec.desc }
      ])
    ),
    values
  );
  const groupOf = (name: string) => definitions[name]?.group ?? "";
  const groups = [...new Set(entries.map(([name]) => groupOf(name)))];
  // Groups the user collapsed; an active filter forces all matching groups open.
  const [closed, setClosed] = useState<string[]>([]);
  const visible = entries.filter(
    ([name, spec]) =>
      (!selectedOnly || name in values) &&
      `${name} ${spec.description ?? ""}`.toLowerCase().includes(filter.toLowerCase())
  );
  const visibleGroups = groups.filter((group) =>
    visible.some(([name]) => groupOf(name) === group)
  );
  return (
    <Stack>
      <Group>
        <TextInput
          label={t`Filter conditions`}
          leftSection={<IconFilter aria-hidden size={16} />}
          value={filter}
          onChange={(event) => {
            setFilter(event.currentTarget.value);
          }}
        />
        <Checkbox
          label={<Trans>Show selected conditions only</Trans>}
          checked={selectedOnly}
          onChange={(event) => {
            setSelectedOnly(event.currentTarget.checked);
          }}
        />
        <Button
          variant="subtle"
          leftSection={<IconArrowsVertical aria-hidden size={16} />}
          onClick={() => {
            setFilter("");
            setSelectedOnly(false);
            setClosed([]);
          }}
        >
          <Trans>Open all groups</Trans>
        </Button>
        <Button
          variant="subtle"
          leftSection={<IconFold aria-hidden size={16} />}
          onClick={() => {
            setFilter("");
            setSelectedOnly(false);
            setClosed(groups);
          }}
        >
          <Trans>Close all groups</Trans>
        </Button>
      </Group>
      <Accordion
        multiple
        value={visibleGroups
          .filter((group) => filter || selectedOnly || !closed.includes(group))
          .map((group) => `group:${group}`)}
        onChange={(open) => {
          setClosed(groups.filter((group) => !open.includes(`group:${group}`)));
        }}
      >
        {visibleGroups.map((group) => (
          <Accordion.Item key={group} value={`group:${group}`}>
            <Accordion.Control>
              {group || <Trans>Miscellaneous</Trans>}
            </Accordion.Control>
            <Accordion.Panel>
              <Stack>
                {visible
                  .filter(([name]) => groupOf(name) === group)
                  .map(([name, spec]) => (
                    <Stack gap="xs" key={name}>
                      <Checkbox
                        label={name}
                        checked={name in values}
                        onChange={(event) => {
                          onChange(
                            event.currentTarget.checked
                              ? { ...values, [name]: spec.type === "multi" ? [] : "" }
                              : Object.fromEntries(
                                  Object.entries(values).filter(([key]) => key !== name)
                                )
                          );
                        }}
                      />
                      <TypedOptionInput
                        id={`condition-${name}`}
                        label={t`Value for ${name}`}
                        spec={{
                          ...spec,
                          required: Boolean(spec.required && name in values)
                        }}
                        disabled={!(name in values)}
                        value={values[name]}
                        onChange={(value) => {
                          onChange({ ...values, [name]: value });
                        }}
                      />
                    </Stack>
                  ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
