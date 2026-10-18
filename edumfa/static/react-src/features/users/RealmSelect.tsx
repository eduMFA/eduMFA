import { useLingui } from "@lingui/react/macro";
import { NativeSelect } from "@mantine/core";

export interface RealmSelectProps {
  onChange: (realm: string) => void;
  realmNames: string[];
  value: string;
}

/** The realm selector in the user list sidebar. */
export function RealmSelect({ onChange, realmNames, value }: RealmSelectProps) {
  const { t } = useLingui();

  return (
    <NativeSelect
      data={realmNames}
      id="realmSelect"
      label={t`Select Realm`}
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      size="sm"
      value={value}
    />
  );
}
