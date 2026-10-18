import { Trans } from "@lingui/react/macro";
import { NativeSelect, Stack } from "@mantine/core";

import type { EventFormChange } from "./types";
import { TypedOptionsTable } from "@/components/forms/TypedOptionsTable";
import { Card } from "@/components/layout/Card";
import {
  choicesWithCurrent,
  type EventForm as EventFormValues
} from "@/features/config/automation/definitionForm";

/** Action choice plus the options that action accepts. */
export function EventActionCard({
  form,
  onChange,
  actionNames,
  actionsReady,
  options
}: {
  form: EventFormValues;
  onChange: EventFormChange;
  actionNames: string[];
  actionsReady: boolean;
  options: Parameters<typeof TypedOptionsTable>[0]["options"];
}) {
  return (
    <Card title={<Trans>Action</Trans>}>
      <Stack>
        <NativeSelect
          label={<Trans>Action</Trans>}
          required
          disabled={!actionsReady}
          data={choicesWithCurrent(actionNames, form.action)}
          value={form.action}
          onChange={(event) => {
            onChange({ action: event.currentTarget.value, options: {} });
          }}
        />

        {form.action && actionsReady ? (
          <TypedOptionsTable
            idPrefix="event-option"
            options={options}
            values={form.options}
            onChange={(name, value) => {
              onChange({ options: { ...form.options, [name]: value } });
            }}
          />
        ) : null}
      </Stack>
    </Card>
  );
}
