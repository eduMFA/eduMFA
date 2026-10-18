import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, NumberInput, Stack, TextInput } from "@mantine/core";

import { isPolicyNameValid, type PolicyFormValues } from "./policyForm";
import { PolicyTemplatePicker } from "./PolicyTemplatePicker";
import type { Policy, PolicyDefinitions, PolicyTemplate } from "@/api/policies";
import { Card } from "@/components/layout/Card";

/** Name, template picker (new policies only), scope, priority and active flag. */
export function PolicyGeneralCard({
  canWrite,
  definitions,
  form,
  onChange,
  onTemplate,
  onTemplateBusyChange,
  policy
}: {
  canWrite: boolean;
  definitions: PolicyDefinitions;
  form: PolicyFormValues;
  onChange: (changes: Partial<PolicyFormValues>) => void;
  onTemplate: (template: PolicyTemplate) => void;
  onTemplateBusyChange: (busy: boolean) => void;
  policy: Policy | undefined;
}) {
  const { t } = useLingui();
  const scopes = [...new Set([form.scope, ...Object.keys(definitions)])];

  return (
    <Card>
      <Stack>
        <TextInput
          label={<Trans>Policy Name</Trans>}
          value={form.name}
          required
          autoFocus
          onChange={(event) => {
            onChange({ name: event.currentTarget.value });
          }}
          error={
            form.name && !isPolicyNameValid(form.name)
              ? t`Use letters, numbers, spaces, underscores, dots or hyphens. Reserved policy names are not allowed.`
              : undefined
          }
          description={
            policy ? (
              <Trans>
                If you change the name of the policy, it will create a new policy with
                the new name!
              </Trans>
            ) : undefined
          }
        />
        {!policy && canWrite ? (
          <PolicyTemplatePicker
            onBusyChange={onTemplateBusyChange}
            onApply={onTemplate}
          />
        ) : null}
        <NativeSelect
          label={<Trans>Scope</Trans>}
          data={scopes}
          value={form.scope}
          required
          onChange={(event) => {
            onChange({ scope: event.currentTarget.value, actions: {} });
          }}
        />
        <NumberInput
          label={<Trans>Priority</Trans>}
          value={form.priority}
          allowDecimal={false}
          min={1}
          required
          onChange={(priority) => {
            onChange({ priority });
          }}
          description={
            <Trans>
              In case of conflicting policies, the policy with the lowest priority
              number will take precedence.
            </Trans>
          }
        />
        {!policy ? (
          <Checkbox
            label={<Trans>Active</Trans>}
            checked={form.active}
            onChange={(event) => {
              onChange({ active: event.currentTarget.checked });
            }}
          />
        ) : null}
      </Stack>
    </Card>
  );
}
