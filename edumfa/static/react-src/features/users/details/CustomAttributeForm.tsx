import { useLingui } from "@lingui/react/macro";
import { Button, Group, NativeSelect, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import type { CustomAttributes } from "./useCustomAttributes";

export interface CustomAttributeFormProps {
  attributes: CustomAttributes;
}

/** Key and value inputs to add a custom attribute, as allowed by policy. */
export function CustomAttributeForm({ attributes }: CustomAttributeFormProps) {
  const { t } = useLingui();
  const { addMutation, draft, settableKeys } = attributes;

  return (
    <Group gap="xs">
      <NativeSelect
        aria-label={t`Custom attribute`}
        data={[{ label: t`Custom attribute`, value: "" }, ...settableKeys]}
        id="attr_key"
        onChange={(event) => {
          draft.selectAttributeKey(event.currentTarget.value);
        }}
        size="sm"
        value={draft.selectedAttributeKey}
      />
      {draft.selectedAttributeKey === "*" ? (
        <TextInput
          aria-label={t`Custom attribute name`}
          id="new_custom_attribute_key"
          onChange={(event) => {
            draft.setCustomAttributeKey(event.currentTarget.value);
          }}
          placeholder={t`Custom attribute name`}
          size="sm"
          value={draft.customAttributeKey}
        />
      ) : null}
      {draft.allowedValues.length !== 1 ? (
        <NativeSelect
          aria-label={t`Custom attribute value`}
          data={[
            { label: t`Custom attribute value`, value: "" },
            ...draft.allowedValues
          ]}
          id="attr_value"
          onChange={(event) => {
            draft.selectAttributeValue(event.currentTarget.value);
          }}
          size="sm"
          value={draft.selectedAttributeValue}
        />
      ) : null}
      {draft.selectedAttributeValue === "*" ? (
        <TextInput
          aria-label={t`Custom attribute value`}
          id="new_custom_attribute_value"
          onChange={(event) => {
            draft.setCustomAttributeValue(event.currentTarget.value);
          }}
          placeholder={t`Custom attribute value`}
          size="sm"
          value={draft.customAttributeValue}
        />
      ) : null}
      <Button
        disabled={!draft.canAddAttribute}
        leftSection={<IconPlus size={16} />}
        loading={addMutation.isPending}
        onClick={() => {
          addMutation.mutate();
        }}
        size="sm"
      >
        {t`Add`}
      </Button>
    </Group>
  );
}
