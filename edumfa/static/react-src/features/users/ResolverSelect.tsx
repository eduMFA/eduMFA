import { Trans } from "@lingui/react/macro";
import { NativeSelect } from "@mantine/core";

export interface ResolverSelectProps {
  onChange: (resolverName: string) => void;
  resolverNames: string[];
  value: string;
}

/** Chooses the editable resolver the new user is written to. */
export function ResolverSelect({
  onChange,
  resolverNames,
  value
}: ResolverSelectProps) {
  return (
    <NativeSelect
      data={resolverNames}
      description={
        <Trans>
          These are the resolvers marked as editable. You can add a user to the
          resolver. The user will appear in the realms, that contain this resolver.
        </Trans>
      }
      id="resolvername"
      label={<Trans>Resolver</Trans>}
      mb="md"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      required
      value={value}
    />
  );
}
