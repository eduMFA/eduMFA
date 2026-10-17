import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, Group, NumberInput, Stack, Text, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

export function QuestionFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const numAnswers = lookups.numAnswers;

  return (
    <>
      <SectionTitle>
        <Trans>Questionnaire</Trans>
      </SectionTitle>
      <Text c="dimmed" mb="sm" size="sm">
        <Trans>Please answer at least {numAnswers} of the following questions.</Trans>
      </Text>
      {lookups.questions.map((question) => (
        <TextInput
          autoComplete="off"
          key={question}
          label={question}
          mb="sm"
          onChange={(event) => {
            onChange({
              questions: { ...form.questions, [question]: event.currentTarget.value }
            });
          }}
          value={form.questions[question] ?? ""}
        />
      ))}
    </>
  );
}

export function FourEyesFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <TextInput
        description={
          <Trans>
            The separator that is used to separate the passwords of the different
            tokens.
          </Trans>
        }
        id="separator"
        label={<Trans>Separator</Trans>}
        maxLength={1}
        mb="sm"
        onChange={(event) => {
          onChange({ separator: event.currentTarget.value });
        }}
        placeholder="|"
        value={form.separator}
      />
      <Text fw={500} size="sm">
        <Trans>Required Realms</Trans>
      </Text>
      <Text c="dimmed" mb="xs" size="sm">
        <Trans>
          Here you can select how many tokens of which realm are required to perform a
          successful authentication.
        </Trans>
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
