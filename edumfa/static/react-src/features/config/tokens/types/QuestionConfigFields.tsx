import { useLingui } from "@lingui/react/macro";
import { Button, Table, TextInput, Title } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import {
  getNextQuestionIndex,
  getText,
  listPrefixedEntries,
  questionKeyPrefix
} from "@/features/config/tokens/tokenConfigForm";

/**
 * Port of `config.token.question.html`. "Add new question" saves right
 * away like the legacy `addQuestion`; the next question index is one above
 * the highest stored index.
 */
export function QuestionConfigFields({
  canDelete,
  canWrite,
  form,
  isSaving,
  onChange,
  onDeleteEntry,
  onSave,
  savedConfig
}: TokenConfigFieldsProps) {
  const { t } = useLingui();
  const questions = listPrefixedEntries(savedConfig, questionKeyPrefix);
  const newQuestionKey = `${questionKeyPrefix}${String(getNextQuestionIndex(savedConfig))}`;
  const newQuestion = getText(form, newQuestionKey);

  return (
    <>
      <HelpText>
        {t`The questionnaire lets you define a set of questions. The questionnaire token needs to define answers to these questions and the user will be presented with a random questions and needs to provide his previously defined answer.`}
      </HelpText>
      <TextInput
        description={t`This is the number of answers a user needs to define to enroll a token.`}
        id="questionAnswers"
        inputMode="numeric"
        label={t`Number of answers`}
        mb="lg"
        onChange={(event) => {
          onChange({ "question.num_answers": event.currentTarget.value });
        }}
        placeholder="5"
        required
        value={getText(form, "question.num_answers")}
      />

      <Title mb="xs" order={4} size="h6">
        {t`Questionnaire`}
      </Title>
      <HelpText>
        {t`These are the possible questions, a user may define answers to.`}
      </HelpText>
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t`Question`}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {questions.map((question) => (
            <Table.Tr key={question.key}>
              <Table.Td>{question.value}</Table.Td>
              <Table.Td w={1}>
                {canDelete ? (
                  <Button
                    color="red"
                    onClick={() => {
                      onDeleteEntry(question.key);
                    }}
                    size="xs"
                    type="button"
                    variant="light"
                  >
                    {t`Delete`}
                  </Button>
                ) : null}
              </Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td>
              <TextInput
                aria-label={t`Question`}
                id="newQuestion"
                onChange={(event) => {
                  onChange({ [newQuestionKey]: event.currentTarget.value });
                }}
                placeholder={t`Question`}
                value={newQuestion}
              />
            </Table.Td>
            <Table.Td w={1}>
              {canWrite ? (
                <Button
                  disabled={newQuestion === ""}
                  leftSection={<IconQuestionMark size={16} />}
                  loading={isSaving}
                  onClick={onSave}
                  size="xs"
                  type="button"
                  variant="default"
                >
                  {t`Add new question`}
                </Button>
              ) : null}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </>
  );
}
