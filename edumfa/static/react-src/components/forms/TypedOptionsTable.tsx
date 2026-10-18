import { useLingui } from "@lingui/react/macro";
import { Table, Text } from "@mantine/core";

import {
  TypedOptionInput,
  type TypedOptionSpec,
  type TypedOptionValue
} from "./TypedOptionInput";

export interface TypedOptionsTableProps {
  /** Prefix of the input ids, e.g. "option" gives `option_<name>`. */
  idPrefix: string;
  onChange: (name: string, value: TypedOptionValue) => void;
  /** The option specs in display order. */
  options: readonly (readonly [string, TypedOptionSpec])[];
  values: Record<string, TypedOptionValue>;
}

/**
 * The two-column options table of the event handler and periodic task
 * editors: the option name on the left, its typed input and description on
 * the right.
 */
export function TypedOptionsTable({
  idPrefix,
  onChange,
  options,
  values
}: TypedOptionsTableProps) {
  const { t } = useLingui();

  if (options.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {t`No options available.`}
      </Text>
    );
  }

  return (
    <Table verticalSpacing="sm">
      <Table.Tbody>
        {options.map(([name, spec]) => (
          <Table.Tr key={name}>
            <Table.Td style={{ verticalAlign: "top", width: "30%" }}>
              <Text fw={700} size="sm">
                {name}
              </Text>
            </Table.Td>
            <Table.Td>
              <TypedOptionInput
                id={`${idPrefix}_${name}`}
                label={name}
                onChange={(value) => {
                  onChange(name, value);
                }}
                spec={spec}
                value={values[name]}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
