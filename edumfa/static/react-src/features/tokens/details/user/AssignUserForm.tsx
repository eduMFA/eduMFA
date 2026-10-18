import { Trans, useLingui } from "@lingui/react/macro";
import { Button, NativeSelect, PasswordInput } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";

import { useAssignUserForm } from "./useAssignUserForm";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { UserLookupField } from "@/components/forms/UserLookupField";
import { Card } from "@/components/layout/Card";

export interface AssignUserFormProps {
  onRefresh: () => Promise<void>;
  serial: string;
}

/** The form that assigns an unassigned token to a user. */
export function AssignUserForm({ onRefresh, serial }: AssignUserFormProps) {
  const { t } = useLingui();
  const {
    activeRealm,
    canAssign,
    isAdmin,
    mutation,
    pin,
    pinRepeat,
    pinsMatch,
    realmNames,
    realmsQuery,
    selectRealm,
    setPin,
    setPinRepeat,
    setUsername,
    username
  } = useAssignUserForm({ onRefresh, serial });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (canAssign) {
          mutation.mutate();
        }
      }}
    >
      <Card
        footer={
          <Button
            disabled={!canAssign}
            id="assignButton"
            leftSection={<IconUserPlus size={16} />}
            loading={mutation.isPending}
            type="submit"
          >
            <Trans>Assign User</Trans>
          </Button>
        }
        title={<Trans>Assign User</Trans>}
      >
        <ErrorAlert error={mutation.error} />
        <ErrorAlert error={realmsQuery.error} />
        {isAdmin ? (
          <NativeSelect
            data={realmNames}
            id="assignRealm"
            label={<Trans>Realm</Trans>}
            mb="sm"
            onChange={(event) => {
              selectRealm(event.currentTarget.value);
            }}
            value={activeRealm}
          />
        ) : null}
        <UserLookupField
          id="assignUsername"
          onChange={setUsername}
          realm={activeRealm}
          required
          value={username}
        />
        <PasswordInput
          autoComplete="new-password"
          id="assignUserPin"
          label={<Trans>PIN/Password</Trans>}
          mb="sm"
          onChange={(event) => {
            setPin(event.currentTarget.value);
          }}
          placeholder={t`Type a PIN or password`}
          value={pin}
        />
        <PasswordInput
          aria-label={t`Repeat PIN or password`}
          autoComplete="new-password"
          error={pinsMatch ? undefined : t`The PINs do not match.`}
          id="assignUserPinRepeat"
          onChange={(event) => {
            setPinRepeat(event.currentTarget.value);
          }}
          placeholder={t`Repeat PIN or password`}
          value={pinRepeat}
        />
      </Card>
    </form>
  );
}
