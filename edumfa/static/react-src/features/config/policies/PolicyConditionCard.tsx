import { useLingui } from "@lingui/react/macro";
import { Checkbox, SimpleGrid, Stack, TextInput } from "@mantine/core";

import { PolicyAdminFields } from "./PolicyAdminFields";
import type { PolicyFormValues } from "./policyForm";
import type { PolicyEditorLookups } from "./usePolicyEditorLookups";
import { CheckboxPickList } from "@/components/forms/CheckboxPickList";
import { Card } from "@/components/layout/Card";

/** Who and where the policy applies to: realms, resolvers, users, nodes, clients and time. */
export function PolicyConditionCard({
  form,
  lookups,
  onChange
}: {
  form: PolicyFormValues;
  lookups: PolicyEditorLookups;
  onChange: (changes: Partial<PolicyFormValues>) => void;
}) {
  const { t } = useLingui();

  return (
    <Card title={t`Condition`}>
      <Stack>
        {form.scope === "admin" ? (
          <PolicyAdminFields
            adminRealms={lookups.adminRealms}
            form={form}
            onChange={onChange}
          />
        ) : null}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <CheckboxPickList
            id="policy-realm"
            label={t`User-Realm`}
            options={lookups.realms}
            selected={form.realm}
            onChange={(realm) => {
              onChange({ realm });
            }}
            filterable
          />
          <CheckboxPickList
            id="policy-resolver"
            label={t`User-Resolver`}
            options={lookups.resolvers}
            selected={form.resolver}
            onChange={(resolver) => {
              onChange({ resolver });
            }}
            filterable
          />
        </SimpleGrid>
        <Checkbox
          label={t`Check all possible resolvers of a user to match the resolver in this policy.`}
          checked={form.checkAllResolvers}
          onChange={(event) => {
            onChange({ checkAllResolvers: event.currentTarget.checked });
          }}
        />
        <TextInput
          label={t`User`}
          value={form.user}
          placeholder="userA, userB"
          onChange={(event) => {
            onChange({ user: event.currentTarget.value });
          }}
        />
        <CheckboxPickList
          id="policy-node"
          label={t`eduMFA Node`}
          options={lookups.nodes}
          selected={form.edumfanode}
          onChange={(edumfanode) => {
            onChange({ edumfanode });
          }}
          columns={2}
        />
        <TextInput
          label={t`Client`}
          value={form.client}
          placeholder="10.0.0.0/8, !10.0.0.124"
          onChange={(event) => {
            onChange({ client: event.currentTarget.value });
          }}
        />
        <TextInput
          label={t`Valid time`}
          value={form.time}
          placeholder="Mon-Fri: 9-18, Sat: 10-15"
          onChange={(event) => {
            onChange({ time: event.currentTarget.value });
          }}
        />
      </Stack>
    </Card>
  );
}
