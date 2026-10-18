import { useLingui } from "@lingui/react/macro";
import { NativeSelect, Title } from "@mantine/core";

import { UserLookupField } from "@/components/forms/UserLookupField";

export interface UserAssignmentFieldsProps {
  onRealmChange: (realm: string) => void;
  onUserChange: (user: string) => void;
  realm: string;
  realmNames: readonly string[];
  user: string;
}

/** The admin's "Assign token to user" section (legacy `assign-user` directive). */
export function UserAssignmentFields({
  onRealmChange,
  onUserChange,
  realm,
  realmNames,
  user
}: UserAssignmentFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <Title mb="xs" mt="md" order={4} size="h6">
        {t`Assign token to user`}
      </Title>
      <NativeSelect
        data={realmNames.includes(realm) ? [...realmNames] : ["", ...realmNames]}
        id="realm"
        label={t`Realm`}
        mb="sm"
        onChange={(event) => {
          onRealmChange(event.currentTarget.value);
        }}
        value={realm}
      />
      <UserLookupField
        id="username"
        onChange={onUserChange}
        realm={realm}
        value={user}
      />
    </>
  );
}
