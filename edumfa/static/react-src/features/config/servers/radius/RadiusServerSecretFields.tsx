import { Trans } from "@lingui/react/macro";
import { Checkbox, PasswordInput, TextInput } from "@mantine/core";

import type {
  RadiusServerFieldSetter,
  RadiusServerFormValues
} from "./radiusServerValues";

export interface RadiusServerSecretFieldsProps {
  /** An existing definition's secret is never delivered, so it is asked for again. */
  isEditing: boolean;
  setValue: RadiusServerFieldSetter;
  values: RadiusServerFormValues;
}

/** The Message-Authenticator switch, the shared secret, the dictionary and the description. */
export function RadiusServerSecretFields({
  isEditing,
  setValue,
  values
}: RadiusServerSecretFieldsProps) {
  return (
    <>
      <Checkbox
        checked={values.enforce_ma}
        description={<Trans>Enforce usage of Message-Authenticator attribute</Trans>}
        id="enforce_ma"
        label={<Trans>Enforce Message-Authenticator</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("enforce_ma", event.currentTarget.checked);
        }}
      />
      <PasswordInput
        autoComplete="new-password"
        description={
          isEditing ? (
            <Trans>
              The stored secret is not shown. Enter it again to save the definition.
            </Trans>
          ) : null
        }
        id="secret"
        label={<Trans>Secret</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("secret", event.currentTarget.value);
        }}
        placeholder="testing123"
        required
        value={values.secret}
      />
      <TextInput
        id="dictionary"
        label={<Trans>Dictionary</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("dictionary", event.currentTarget.value);
        }}
        placeholder="/etc/edumfa/dictionary"
        value={values.dictionary}
      />
      <TextInput
        id="description"
        label={<Trans>Description</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("description", event.currentTarget.value);
        }}
        placeholder="some wise words"
        value={values.description}
      />
    </>
  );
}
