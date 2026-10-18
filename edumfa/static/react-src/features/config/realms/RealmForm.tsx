import { useLingui } from "@lingui/react/macro";
import { Checkbox, Group, NumberInput, Stack, Text } from "@mantine/core";

import type { ResolverConfig } from "@/api/config";
import type { RealmResolverSelections } from "@/api/realms";

/** The legacy `resourceNamePatterns.simple` used by the realm name input. */
export const realmNamePattern = /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/;

/** The legacy priority inputs allowed 1 to 999. */
const minPriority = 1;
const maxPriority = 999;

/** A selection is valid when every given priority is an integer within the legacy range. */
export function isRealmSelectionValid(selections: RealmResolverSelections): boolean {
  return Object.values(selections).every(
    (selection) =>
      !selection.selected ||
      selection.priority === null ||
      (Number.isInteger(selection.priority) &&
        selection.priority >= minPriority &&
        selection.priority <= maxPriority)
  );
}

export interface RealmFormProps {
  /** Prefix of the input ids, so the create form and the edit row do not collide. */
  idPrefix: string;
  onChange: (selections: RealmResolverSelections) => void;
  resolvers: readonly ResolverConfig[];
  selections: RealmResolverSelections;
}

/**
 * The resolver picker of `config.realms.list.html` (the "TODO: component"
 * of the legacy template): one checkbox per resolver with a priority input
 * once the resolver is selected.
 */
export function RealmForm({
  idPrefix,
  onChange,
  resolvers,
  selections
}: RealmFormProps) {
  const { t } = useLingui();

  if (resolvers.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {t`No resolvers defined.`}
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {resolvers.map((resolver) => {
        const resolverName = resolver.resolvername;
        const selection = selections[resolverName];
        const isSelected = selection?.selected ?? false;

        return (
          <Group align="center" gap="sm" key={resolverName} wrap="nowrap">
            <Checkbox
              checked={isSelected}
              id={`${idPrefix}-${resolverName}`}
              label={`${resolverName} (${resolver.type})`}
              onChange={(event) => {
                onChange({
                  ...selections,
                  [resolverName]: {
                    priority: selection?.priority ?? null,
                    selected: event.currentTarget.checked
                  }
                });
              }}
            />
            {isSelected ? (
              <NumberInput
                allowDecimal={false}
                aria-label={t`Priority of ${resolverName}`}
                max={maxPriority}
                min={minPriority}
                onChange={(value) => {
                  onChange({
                    ...selections,
                    [resolverName]: {
                      priority: typeof value === "number" ? value : null,
                      selected: true
                    }
                  });
                }}
                placeholder={t`priority`}
                size="xs"
                value={selection?.priority ?? ""}
                w={90}
              />
            ) : null}
          </Group>
        );
      })}
    </Stack>
  );
}
