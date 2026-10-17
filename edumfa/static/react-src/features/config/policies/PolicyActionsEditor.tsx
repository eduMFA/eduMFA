import { Trans, useLingui } from "@lingui/react/macro";
import { IconFilter, IconFold, IconArrowsVertical } from "@tabler/icons-react";
import {
  Accordion,
  Anchor,
  Box,
  Checkbox,
  Group,
  Button,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import { useState } from "react";

import type { PolicyActionDefinition } from "@/api/policies";
import {
  TypedOptionInput,
  type TypedOptionValue
} from "@/components/forms/TypedOptionInput";
import { useDocsUrl } from "@/lib/docs";

interface Props {
  scope: string;
  definitions: Record<string, PolicyActionDefinition>;
  actions: Record<string, TypedOptionValue>;
  onChange: (actions: Record<string, TypedOptionValue>) => void;
}

export function PolicyActionsEditor({ scope, definitions, actions, onChange }: Props) {
  const { t } = useLingui();
  const docsUrl = useDocsUrl(`policies/${encodeURIComponent(scope)}.html`);
  const [filter, setFilter] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const known = Object.entries(definitions);
  const unknown: [string, PolicyActionDefinition][] = Object.keys(actions)
    .filter((key) => !(key in definitions))
    .map((key) => [key, { type: typeof actions[key] === "boolean" ? "bool" : "str" }]);
  const entries = [...known, ...unknown].sort(([a], [b]) => a.localeCompare(b));
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

  return (
    <Stack>
      <Group>
        <TextInput
          label={t`Filter actions`}
          leftSection={<IconFilter aria-hidden size={16} />}
          value={filter}
          onChange={(event) => {
            setFilter(event.currentTarget.value);
          }}
        />
        <Checkbox
          checked={selectedOnly}
          label={<Trans>Show selected actions only</Trans>}
          onChange={(event) => {
            setSelectedOnly(event.currentTarget.checked);
          }}
        />
        <Button
          leftSection={<IconArrowsVertical aria-hidden size={16} />}
          type="button"
          variant="subtle"
          onClick={() => {
            setFilter("");
            setSelectedOnly(false);
            setOpenGroups(groups.map((group) => `group:${group}`));
          }}
        >
          <Trans>Open all groups</Trans>
        </Button>
        <Button
          leftSection={<IconFold aria-hidden size={16} />}
          type="button"
          variant="subtle"
          onClick={() => {
            setFilter("");
            setSelectedOnly(false);
            setOpenGroups([]);
          }}
        >
          <Trans>Close all groups</Trans>
        </Button>
      </Group>
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
                  .map(([name, spec]) => {
                    const selected = name in actions;
                    const rawValue = actions[name];
                    const value =
                      spec.multiple && typeof rawValue === "string"
                        ? rawValue.split(/\s+/).filter(Boolean)
                        : rawValue;
                    const choices =
                      spec.value === undefined ? undefined : [...spec.value];
                    if (
                      choices &&
                      !spec.multiple &&
                      (typeof value === "number" || typeof value === "string") &&
                      !choices.some((choice) => String(choice) === String(value))
                    )
                      choices.unshift(value);
                    return (
                      <Stack className="policy-action-item" gap="xs" key={name}>
                        <Box className="policy-action-row">
                          <Checkbox
                            className="policy-action-description"
                            checked={selected}
                            label={name}
                            description={spec.desc}
                            onChange={(event) => {
                              onChange(
                                event.currentTarget.checked
                                  ? {
                                      ...actions,
                                      [name]:
                                        spec.type === "bool"
                                          ? true
                                          : spec.multiple
                                            ? []
                                            : ""
                                    }
                                  : Object.fromEntries(
                                      Object.entries(actions).filter(
                                        ([key]) => key !== name
                                      )
                                    )
                              );
                            }}
                          />
                          <Anchor
                            className="policy-action-help"
                            href={`${docsUrl}#${name.replaceAll("_", "-").toLowerCase()}`}
                            target="_blank"
                            rel="noopener"
                            size="xs"
                          >
                            <Trans>Help</Trans>
                          </Anchor>
                        </Box>
                        {spec.type !== "bool" ? (
                          <TypedOptionInput
                            id={`policy-action-${name}`}
                            label={t`Value for ${name}`}
                            disabled={!selected}
                            spec={{
                              type: spec.multiple ? "multi" : spec.type,
                              value: choices,
                              required: selected
                            }}
                            value={value}
                            onChange={(next) => {
                              onChange({ ...actions, [name]: next });
                            }}
                          />
                        ) : null}
                        {!(name in definitions) ? (
                          <Text c="dimmed" size="xs">
                            <Trans>
                              This action is not in the current definitions. Its value
                              will be preserved.
                            </Trans>
                          </Text>
                        ) : null}
                      </Stack>
                    );
                  })}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
