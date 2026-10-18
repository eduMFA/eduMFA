import { useLingui } from "@lingui/react/macro";
import { NativeSelect } from "@mantine/core";

export interface TokenTypeSelectProps {
  /** Enrollable token types with their descriptions. */
  enrollTypes: Record<string, string>;
  onChange: (type: string) => void;
  value: string;
}

/** The "Token type" select of the enrollment form. */
export function TokenTypeSelect({
  enrollTypes,
  onChange,
  value
}: TokenTypeSelectProps) {
  const { t } = useLingui();

  return (
    <NativeSelect
      data={Object.keys(enrollTypes).map((typeName) => ({
        label: enrollTypes[typeName] ?? typeName,
        value: typeName
      }))}
      id="tokentype"
      label={t`Token type`}
      mb="md"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      value={value}
    />
  );
}
