import { Trans } from "@lingui/react/macro";
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
  return (
    <>
      <TextInput
        autoFocus
        description={
          <Trans>
            This is the unique identifying name of the eduMFA server definition.
          </Trans>
        }
        error={identifierError}
        id="identifier"
        label={<Trans>Identifier</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("identifier", event.currentTarget.value);
        }}
        placeholder="Remote eduMFA Server"
        required
        value={values.identifier}
      />
      <TextInput
        description={<Trans>Please provide the base URL of the eduMFA server.</Trans>}
        id="url"
        label={<Trans>URL of the eduMFA server</Trans>}
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
        description={
          <Trans>
            The certificate will be checked for a valid hostname and for a trusted
            certificate. Do not uncheck this in productive use!
          </Trans>
        }
        id="tls"
        label={<Trans>Verify the certificate</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("tls", event.currentTarget.checked);
        }}
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
