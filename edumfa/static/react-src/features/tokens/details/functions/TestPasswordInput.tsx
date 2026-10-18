import { useLingui } from "@lingui/react/macro";
import { PasswordInput, TextInput } from "@mantine/core";

export interface TestPasswordInputProps {
  onChange: (value: string) => void;
  placeholder: string;
  /** Plain text input instead of the masked one. */
  showPassword: boolean;
  value: string;
}

/** The test password, masked unless "Show password" is ticked. */
export function TestPasswordInput({
  onChange,
  placeholder,
  showPassword,
  value
}: TestPasswordInputProps) {
  const { t } = useLingui();

  if (showPassword) {
    return (
      <TextInput
        aria-label={t`Test password`}
        autoComplete="off"
        id="testPassword"
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        placeholder={placeholder}
        value={value}
      />
    );
  }

  return (
    <PasswordInput
      aria-label={t`Test password`}
      autoComplete="new-password"
      id="testPassword"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      placeholder={placeholder}
      value={value}
    />
  );
}
