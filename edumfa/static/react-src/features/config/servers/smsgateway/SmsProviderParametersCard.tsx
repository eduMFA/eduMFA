import { Trans } from "@lingui/react/macro";
import { Text } from "@mantine/core";

import { SmsProviderParameterField } from "./SmsProviderParameterField";
import type { SmsProviderParameter } from "@/api/servers";
import { Card } from "@/components/layout/Card";

export interface SmsProviderParametersCardProps {
  onChange: (name: string, value: string) => void;
  /** The declared parameters of the selected provider module. */
  parameters: Record<string, SmsProviderParameter>;
  values: Record<string, string>;
}

/** The "Parameters" card: one field per declared parameter of the provider module. */
export function SmsProviderParametersCard({
  onChange,
  parameters,
  values
}: SmsProviderParametersCardProps) {
  return (
    <Card title={<Trans>Parameters</Trans>}>
      {Object.entries(parameters).map(([name, parameter]) => (
        <SmsProviderParameterField
          key={name}
          name={name}
          onChange={(value) => {
            onChange(name, value);
          }}
          parameter={parameter}
          value={values[name] ?? ""}
        />
      ))}
      {Object.keys(parameters).length === 0 ? (
        <Text c="dimmed" size="sm">
          <Trans>This provider module has no parameters.</Trans>
        </Text>
      ) : null}
    </Card>
  );
}
