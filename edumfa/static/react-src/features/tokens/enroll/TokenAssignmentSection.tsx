import { useLingui } from "@lingui/react/macro";

import { type EnrollFormError, type EnrollFormState } from "./enrollForm";
import type { EnrollVisibility } from "./enrollVisibility";
import { ExtendedAttributesFields } from "./ExtendedAttributesFields";
import { PinFields } from "./PinFields";
import { UserAssignmentFields } from "./UserAssignmentFields";

export interface TokenAssignmentSectionProps {
  errors: readonly EnrollFormError[];
  form: EnrollFormState;
  onChange: (patch: Partial<EnrollFormState>) => void;
  /** The resolved realm (the default while untouched). */
  realm: string;
  realmNames: readonly string[];
  visibility: EnrollVisibility;
}

/** The owner, PIN and validity period below the token data. */
export function TokenAssignmentSection({
  errors,
  form,
  onChange,
  realm,
  realmNames,
  visibility
}: TokenAssignmentSectionProps) {
  const { t } = useLingui();

  return (
    <>
      {visibility.showUserAssignment ? (
        <UserAssignmentFields
          onRealmChange={(value) => {
            onChange({ realm: value });
          }}
          onUserChange={(value) => {
            onChange({ user: value });
          }}
          realm={realm}
          realmNames={realmNames}
          user={form.user}
        />
      ) : null}

      {visibility.showUserAssignment || visibility.showPin ? (
        <PinFields
          error={
            errors.includes("pin") && form.pinRepeat !== ""
              ? t`The PINs do not match.`
              : undefined
          }
          onPinChange={(pin) => {
            onChange({ pin });
          }}
          onPinRepeatChange={(pinRepeat) => {
            onChange({ pinRepeat });
          }}
          pin={form.pin}
          pinRepeat={form.pinRepeat}
        />
      ) : null}

      {visibility.showExtendedAttributes ? (
        <ExtendedAttributesFields
          onChange={onChange}
          validityEnd={form.validityEnd}
          validityError={
            errors.includes("validity") ? t`End Date before Start Date!` : undefined
          }
          validityStart={form.validityStart}
        />
      ) : null}
    </>
  );
}
