import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <Card>
      <TextInput
        autoFocus
        id="name"
        label={t`Name`}
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
        label={t`Providermodule`}
        mb="sm"
        onChange={(event) => {
          setValue("module", event.currentTarget.value);
        }}
        required
        value={values.module}
      />
      <TextInput
        id="description"
        label={t`Description`}
        mb="sm"
        onChange={(event) => {
          setValue("description", event.currentTarget.value);
        }}
        value={values.description}
      />
    </Card>
  );
}
