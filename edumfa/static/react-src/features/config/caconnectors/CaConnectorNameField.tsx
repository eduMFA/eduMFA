import { Trans } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";
import type { UseFormRegisterReturn } from "react-hook-form";

export interface CaConnectorNameFieldProps {
  error: string | undefined;
  /** `register("connectorname", ...)` of the owning form. */
  registration: UseFormRegisterReturn;
}

/** The connector name input both CA connector forms start with. */
export function CaConnectorNameField({
  error,
  registration
}: CaConnectorNameFieldProps) {
  return (
    <TextInput
      autoFocus
      error={error}
      id="connectorname"
      label={<Trans>Connector name</Trans>}
      mb="md"
      placeholder="MyConnector1"
      required
      {...registration}
    />
  );
}
