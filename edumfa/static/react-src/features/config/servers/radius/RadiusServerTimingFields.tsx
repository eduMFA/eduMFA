import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <NumberInput
          allowDecimal={false}
          allowNegative={false}
          id="port"
          label={t`Port`}
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
          label={t`Timeout`}
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
          label={t`Retries`}
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
