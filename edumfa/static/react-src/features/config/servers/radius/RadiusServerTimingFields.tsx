import { Trans } from "@lingui/react/macro";
import { Grid, NumberInput } from "@mantine/core";

import type {
  RadiusServerFieldSetter,
  RadiusServerFormValues
} from "./radiusServerValues";

export interface RadiusServerTimingFieldsProps {
  setValue: RadiusServerFieldSetter;
  values: RadiusServerFormValues;
}

/** The port, timeout and retries row. */
export function RadiusServerTimingFields({
  setValue,
  values
}: RadiusServerTimingFieldsProps) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <NumberInput
          allowDecimal={false}
          allowNegative={false}
          id="port"
          label={<Trans>Port</Trans>}
          mb="sm"
          onChange={(value) => {
            setValue("port", value);
          }}
          placeholder="1812"
          value={values.port}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <NumberInput
          allowDecimal={false}
          allowNegative={false}
          id="timeout"
          label={<Trans>Timeout</Trans>}
          mb="sm"
          onChange={(value) => {
            setValue("timeout", value);
          }}
          placeholder="5"
          value={values.timeout}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <NumberInput
          allowDecimal={false}
          allowNegative={false}
          id="retries"
          label={<Trans>Retries</Trans>}
          mb="sm"
          onChange={(value) => {
            setValue("retries", value);
          }}
          placeholder="3"
          value={values.retries}
        />
      </Grid.Col>
    </Grid>
  );
}
