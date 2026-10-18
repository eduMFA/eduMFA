import { Trans } from "@lingui/react/macro";
import { Text, TextInput } from "@mantine/core";

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
