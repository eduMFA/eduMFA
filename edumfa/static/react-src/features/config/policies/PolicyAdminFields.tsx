import { Trans } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";

import type { PolicyFormValues } from "./policyForm";
import { CheckboxPickList } from "@/components/forms/CheckboxPickList";

/** Admin realm and admin user filters, only offered for the admin scope. */
export function PolicyAdminFields({
  adminRealms,
  form,
  onChange
}: {
  adminRealms: readonly string[];
  form: PolicyFormValues;
  onChange: (changes: Partial<PolicyFormValues>) => void;
}) {
  return (
    <>
      <CheckboxPickList
        id="policy-adminrealm"
        label={<Trans>Admin-Realm</Trans>}
        options={adminRealms}
        selected={form.adminrealm}
        onChange={(adminrealm) => {
          onChange({ adminrealm });
        }}
        columns={2}
      />
      <TextInput
        label={<Trans>Admin</Trans>}
        value={form.adminuser}
        onChange={(event) => {
          onChange({ adminuser: event.currentTarget.value });
        }}
        placeholder="admin, superuser"
      />
    </>
  );
}
