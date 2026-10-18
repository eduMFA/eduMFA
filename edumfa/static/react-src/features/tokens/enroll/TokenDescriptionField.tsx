import { useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";

export interface TokenDescriptionFieldProps {
  onChange: (description: string) => void;
  required: boolean;
  /** The description exceeds the 80 characters the backend accepts. */
  tooLong: boolean;
  value: string;
}

/** The token description input of the enrollment form. */
export function TokenDescriptionField({
  onChange,
  required,
  tooLong,
  value
}: TokenDescriptionFieldProps) {
  const { t } = useLingui();

  return (
    <TextInput
      autoComplete="off"
      error={tooLong ? t`The description may have at most 80 characters.` : undefined}
      id="description"
      label={t`Description`}
      mb="sm"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      placeholder={t`Some nice words...`}
      required={required}
      value={value}
    />
  );
}
