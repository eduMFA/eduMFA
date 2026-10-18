import { useLingui } from "@lingui/react/macro";
import { Checkbox, TextInput } from "@mantine/core";

import type {
  EduMfaServerFieldSetter,
  EduMfaServerFormValues
} from "./eduMfaServerValues";

export interface EduMfaServerFieldsProps {
  identifierError: string | undefined;
  setValue: EduMfaServerFieldSetter;
  values: EduMfaServerFormValues;
}

/** The identifier, the URL, the certificate check and the description. */
export function EduMfaServerFields({
  identifierError,
  setValue,
  values
}: EduMfaServerFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <TextInput
        autoFocus
        description={t`This is the unique identifying name of the eduMFA server definition.`}
        error={identifierError}
        id="identifier"
        label={t`Identifier`}
        mb="sm"
        onChange={(event) => {
          setValue("identifier", event.currentTarget.value);
        }}
        placeholder="Remote eduMFA Server"
        required
        value={values.identifier}
      />
      <TextInput
        description={t`Please provide the base URL of the eduMFA server.`}
        id="url"
        label={t`URL of the eduMFA server`}
        mb="sm"
        onChange={(event) => {
          setValue("url", event.currentTarget.value);
        }}
        placeholder="https://mfa.example.com/"
        required
        value={values.url}
      />
      <Checkbox
        checked={values.tls}
        description={t`The certificate will be checked for a valid hostname and for a trusted certificate. Do not uncheck this in productive use!`}
        id="tls"
        label={t`Verify the certificate`}
        mb="sm"
        onChange={(event) => {
          setValue("tls", event.currentTarget.checked);
        }}
      />
      <TextInput
        id="description"
        label={t`Description`}
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
