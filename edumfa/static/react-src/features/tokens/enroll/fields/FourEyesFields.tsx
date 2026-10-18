import { useLingui } from "@lingui/react/macro";
import { Checkbox, Group, NumberInput, Stack, Text, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function FourEyesFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>{t`Token data`}</SectionTitle>
      <TextInput
        description={t`The separator that is used to separate the passwords of the different tokens.`}
        id="separator"
        label={t`Separator`}
        maxLength={1}
        mb="sm"
        onChange={(event) => {
          onChange({ separator: event.currentTarget.value });
        }}
        placeholder="|"
        value={form.separator}
      />
      <Text fw={500} size="sm">
        {t`Required Realms`}
      </Text>
      <Text c="dimmed" mb="xs" size="sm">
        {t`Here you can select how many tokens of which realm are required to perform a successful authentication.`}
      </Text>
      <Stack gap="xs" mb="sm">
        {lookups.realms.map((realmName) => {
          const entry = form.fourEyes[realmName] ?? { count: 1, selected: false };

          return (
            <Group key={realmName} gap="sm">
              <Checkbox
                checked={entry.selected}
                id={`cb_realm_${realmName}`}
                label={realmName}
                onChange={(event) => {
                  onChange({
                    fourEyes: {
                      ...form.fourEyes,
                      [realmName]: { ...entry, selected: event.currentTarget.checked }
                    }
                  });
                }}
              />
              {entry.selected ? (
                <NumberInput
                  aria-label={t`Number of required tokens`}
                  max={9}
                  min={1}
                  onChange={(value) => {
                    onChange({
                      fourEyes: {
                        ...form.fourEyes,
                        [realmName]: {
                          ...entry,
                          count: typeof value === "number" ? value : 1
                        }
                      }
                    });
                  }}
                  size="xs"
                  value={entry.count}
                  w={80}
                />
              ) : null}
            </Group>
          );
        })}
      </Stack>
    </>
  );
}
