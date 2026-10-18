import { useLingui } from "@lingui/react/macro";
import { Button, Text, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { isRealmSelectionValid, RealmForm, realmNamePattern } from "./RealmForm";
import type { ResolverConfig } from "@/api/config";
import type { RealmResolverSelections } from "@/api/realms";
import { Card } from "@/components/layout/Card";

export interface NewRealmCardProps {
  isSaving: boolean;
  name: string;
  onNameChange: (name: string) => void;
  /** Only called with a valid name and selection. */
  onSave: (name: string, selections: RealmResolverSelections) => void;
  onSelectionsChange: (selections: RealmResolverSelections) => void;
  resolvers: readonly ResolverConfig[];
  selections: RealmResolverSelections;
}

/** The create form below the realm table: the name and the resolver picker. */
export function NewRealmCard({
  isSaving,
  name,
  onNameChange,
  onSave,
  onSelectionsChange,
  resolvers,
  selections
}: NewRealmCardProps) {
  const { t } = useLingui();
  const isNameValid = realmNamePattern.test(name);
  const isValid = isNameValid && isRealmSelectionValid(selections);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValid) {
          onSave(name, selections);
        }
      }}
    >
      <Card
        footer={
          <Button
            disabled={!isValid}
            leftSection={<IconPlus size={16} />}
            loading={isSaving}
            type="submit"
          >
            {t`Create realm`}
          </Button>
        }
        title={t`New realm`}
      >
        <TextInput
          error={
            name !== "" && !isNameValid
              ? t`The resource name must consist of letters, numbers and '_', '-', '.'`
              : undefined
          }
          id="realmname"
          label={t`Realm name`}
          mb="md"
          onChange={(event) => {
            onNameChange(event.currentTarget.value);
          }}
          placeholder={t`new realm`}
          required
          value={name}
        />
        <Text c="dimmed" fw={600} mb={6} size="xs" tt="uppercase">
          {t`resolvers`}
        </Text>
        <RealmForm
          idPrefix="new"
          onChange={onSelectionsChange}
          resolvers={resolvers}
          selections={selections}
        />
      </Card>
    </form>
  );
}
