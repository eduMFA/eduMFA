import { Trans } from "@lingui/react/macro";
import { Accordion, Stack, Text } from "@mantine/core";
import { useState } from "react";

import { listPolicyActionEntries } from "./policyActionEntries";
import { PolicyActionItem } from "./PolicyActionItem";
import { PolicyActionsToolbar } from "./PolicyActionsToolbar";
import type { PolicyActionDefinition } from "@/api/policies";
import type { TypedOptionValue } from "@/components/forms/TypedOptionInput";
import { useDocsUrl } from "@/lib/docs";

interface Props {
  scope: string;
  definitions: Record<string, PolicyActionDefinition>;
  actions: Record<string, TypedOptionValue>;
  onChange: (actions: Record<string, TypedOptionValue>) => void;
}

export function PolicyActionsEditor({ scope, definitions, actions, onChange }: Props) {
  const docsUrl = useDocsUrl(`policies/${encodeURIComponent(scope)}.html`);
  const [filter, setFilter] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const entries = listPolicyActionEntries(definitions, actions);
  const groups = [...new Set(entries.map(([, spec]) => spec.group ?? ""))];
  const [openGroups, setOpenGroups] = useState(groups.map((group) => `group:${group}`));
  const needle = filter.toLowerCase();
  const visible = entries.filter(
    ([name, spec]) =>
      (!selectedOnly || name in actions) &&
      `${name} ${spec.desc ?? ""}`.toLowerCase().includes(needle)
  );
  const visibleGroups = groups.filter((group) =>
    visible.some(([, spec]) => (spec.group ?? "") === group)
  );
  const reset = (open: string[]) => {
    setFilter("");
    setSelectedOnly(false);
    setOpenGroups(open);
  };

  return (
    <Stack>
      <PolicyActionsToolbar
        filter={filter}
        selectedOnly={selectedOnly}
        onFilterChange={setFilter}
        onSelectedOnlyChange={setSelectedOnly}
        onOpenAll={() => {
          reset(groups.map((group) => `group:${group}`));
        }}
        onCloseAll={() => {
          reset([]);
        }}
      />
      {visible.length === 0 ? (
        <Text c="dimmed">
          <Trans>No actions match the filter.</Trans>
        </Text>
      ) : null}
      <Accordion
        className="definition-accordion"
        multiple
        value={
          filter || selectedOnly
            ? visibleGroups.map((group) => `group:${group}`)
            : openGroups
        }
        onChange={setOpenGroups}
      >
        {visibleGroups.map((group) => (
          <Accordion.Item
            className="definition-accordion-group"
            key={group}
            value={`group:${group}`}
          >
            <Accordion.Control>
              {group || <Trans>Miscellaneous</Trans>}
            </Accordion.Control>
            <Accordion.Panel>
              <Stack>
                {visible
                  .filter(([, spec]) => (spec.group ?? "") === group)
                  .map(([name, spec]) => (
                    <PolicyActionItem
                      key={name}
                      actions={actions}
                      docsUrl={docsUrl}
                      known={name in definitions}
                      name={name}
                      spec={spec}
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
