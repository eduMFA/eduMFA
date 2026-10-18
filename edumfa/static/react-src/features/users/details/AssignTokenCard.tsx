import { useLingui } from "@lingui/react/macro";
import { Button, PasswordInput } from "@mantine/core";

import type { AssignTokenForm } from "./useAssignToken";
import { SerialLookupField } from "@/components/forms/SerialLookupField";
import { Card } from "@/components/layout/Card";

export interface AssignTokenCardProps {
  assignment: AssignTokenForm;
}

/** Serial lookup plus PIN inputs to assign an unassigned token to the user. */
export function AssignTokenCard({ assignment }: AssignTokenCardProps) {
  const { t } = useLingui();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        assignment.mutation.mutate();
      }}
    >
      <Card
        footer={
          <Button
            disabled={!assignment.canAssign}
            id="assignButton"
            loading={assignment.mutation.isPending}
            type="submit"
          >
            {t`Assign Token`}
          </Button>
        }
        title={t`Assign an existing token`}
      >
        <SerialLookupField
          id="assignSerial"
          onChange={assignment.setSerial}
          placeholder={t`start typing a serial number of a token that is notassigned, yet.`}
          required
          unassignedOnly
          value={assignment.serial}
        />
        <PasswordInput
          autoComplete="new-password"
          id="assignPin"
          label={t`PIN/Password`}
          mb="sm"
          onChange={(event) => {
            assignment.setPin(event.currentTarget.value);
          }}
          placeholder={t`Type a PIN or password`}
          value={assignment.pin}
        />
        <PasswordInput
          aria-label={t`Repeat PIN or password`}
          autoComplete="new-password"
          error={assignment.pinsMatch ? undefined : t`The PINs do not match.`}
          id="assignPinRepeat"
          onChange={(event) => {
            assignment.setPinRepeat(event.currentTarget.value);
          }}
          placeholder={t`Repeat PIN or password`}
          value={assignment.pinRepeat}
        />
      </Card>
    </form>
  );
}
