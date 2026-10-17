import { Trans, useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";

import { getResolverNameError } from "./resolverTypes";

export interface ResolverNameFieldProps {
  onChange: (value: string) => void;
  value: string;
}

/**
 * The "Resolver name" input of every editor with the inline validation of
 * the legacy `ng-pattern` / `title` pair.
 */
export function ResolverNameField({ onChange, value }: ResolverNameFieldProps) {
  const { t } = useLingui();
  const error = getResolverNameError(value);
  const errorMessages = {
    pattern: t`The resource name must consist of letters, numbers and '_', '-', '.'`,
    reserved: t`The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'test'`
  };

  return (
    <TextInput
      autoFocus
      error={error ? errorMessages[error] : undefined}
      id="resolvername"
      label={<Trans>Resolver name</Trans>}
      mb="sm"
      name="resolvername"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      placeholder="resolver1"
      required
      value={value}
    />
  );
}
