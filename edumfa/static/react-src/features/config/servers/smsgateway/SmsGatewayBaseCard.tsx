import { Trans } from "@lingui/react/macro";
import { NativeSelect, TextInput } from "@mantine/core";

import type { SmsGatewayFieldSetter, SmsGatewayFormValues } from "./smsGatewayValues";
import { Card } from "@/components/layout/Card";

export interface SmsGatewayBaseCardProps {
  moduleNames: string[];
  setValue: SmsGatewayFieldSetter;
  values: SmsGatewayFormValues;
}

/** The name, the provider module and the description of the gateway. */
export function SmsGatewayBaseCard({
  moduleNames,
  setValue,
  values
}: SmsGatewayBaseCardProps) {
  return (
    <Card>
      <TextInput
        autoFocus
        id="name"
        label={<Trans>Name</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("name", event.currentTarget.value);
        }}
        required
        value={values.name}
      />
      <NativeSelect
        data={[{ label: "", value: "" }, ...moduleNames]}
        id="module"
        label={<Trans>Providermodule</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("module", event.currentTarget.value);
        }}
        required
        value={values.module}
      />
      <TextInput
        id="description"
        label={<Trans>Description</Trans>}
        mb="sm"
        onChange={(event) => {
          setValue("description", event.currentTarget.value);
        }}
        value={values.description}
      />
    </Card>
  );
}
