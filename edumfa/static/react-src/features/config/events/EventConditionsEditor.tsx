import { Trans } from "@lingui/react/macro";
import { Accordion, Stack } from "@mantine/core";
import { useState } from "react";
import { EventConditionItem } from "./EventConditionItem";
import { EventConditionsToolbar } from "./EventConditionsToolbar";
import type { EventHandlerConditions } from "@/api/events";
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
  const reset = (closedGroups: string[]) => {
    setFilter("");
    setSelectedOnly(false);
    setClosed(closedGroups);
  };
  return (
    <Stack>
      <EventConditionsToolbar
        filter={filter}
        selectedOnly={selectedOnly}
        onFilterChange={setFilter}
        onSelectedOnlyChange={setSelectedOnly}
        onOpenAll={() => {
          reset([]);
        }}
        onCloseAll={() => {
          reset(groups);
        }}
      />
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
                    <EventConditionItem
                      key={name}
                      name={name}
                      spec={spec}
                      values={values}
                      onChange={onChange}
                    />
                  ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
