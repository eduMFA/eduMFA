import { useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";

import type {
  RadiusServerFieldSetter,
  RadiusServerFormValues
} from "./radiusServerValues";

export interface RadiusServerConnectionFieldsProps {
  identifierError: string | undefined;
  setValue: RadiusServerFieldSetter;
  values: RadiusServerFormValues;
}

/** The identifier and the server address. */
export function RadiusServerConnectionFields({
  identifierError,
  setValue,
  values
}: RadiusServerConnectionFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <TextInput
        autoFocus
        description={t`This is the unique identifying name of the RADIUS server definition.`}
        error={identifierError}
        id="identifier"
        label={t`Identifier`}
        mb="sm"
        onChange={(event) => {
          setValue("identifier", event.currentTarget.value);
        }}
        placeholder="myRadiusServer"
        required
        value={values.identifier}
      />
      <TextInput
        id="server"
        label={t`IP or FQDN`}
        mb="sm"
        onChange={(event) => {
          setValue("server", event.currentTarget.value);
        }}
        placeholder="1.2.3.4"
        required
        value={values.server}
      />
    </>
  );
}
