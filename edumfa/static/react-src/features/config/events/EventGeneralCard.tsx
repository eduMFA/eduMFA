import { Trans } from "@lingui/react/macro";
import { Checkbox, NativeSelect, NumberInput, Stack, TextInput } from "@mantine/core";

import type { EventFormChange } from "./types";
import { CheckboxPickList } from "@/components/forms/CheckboxPickList";
import { Card } from "@/components/layout/Card";
import {
  choicesWithCurrent,
  type EventForm as EventFormValues
} from "@/features/config/automation/definitionForm";

/** Name, status, triggering events, handler module, position and order of a handler. */
export function EventGeneralCard({
  form,
  onChange,
  events,
  modules,
  positions,
  positionsReady
}: {
  form: EventFormValues;
  onChange: EventFormChange;
  events: string[];
  modules: string[];
  positions: string[];
  positionsReady: boolean;
}) {
  return (
    <Card>
      <Stack>
        <TextInput
          label={<Trans>Description</Trans>}
          required
          value={form.name}
          onChange={(event) => {
            onChange({ name: event.currentTarget.value });
          }}
        />

        <Checkbox
          label={<Trans>Active</Trans>}
          checked={form.active}
          onChange={(event) => {
            onChange({ active: event.currentTarget.checked });
          }}
        />

        <CheckboxPickList
          id="event-names"
          label={<Trans>Events</Trans>}
          required
          options={events}
          selected={form.event}
          onChange={(event) => {
            onChange({ event });
          }}
        />

        <NativeSelect
          label={<Trans>Handlermodule</Trans>}
          required
          data={choicesWithCurrent(modules, form.handlermodule)}
          value={form.handlermodule}
          onChange={(event) => {
            // Actions, positions, options and conditions all depend on the module.
            onChange({
              handlermodule: event.currentTarget.value,
              action: "",
              position: "",
              options: {},
              conditions: {}
            });
          }}
        />

        <NativeSelect
          label={<Trans>Position</Trans>}
          required
          disabled={!positionsReady}
          data={choicesWithCurrent(positions, form.position)}
          value={form.position}
          onChange={(event) => {
            onChange({ position: event.currentTarget.value });
          }}
        />

        <NumberInput
          label={<Trans>Order</Trans>}
          min={0}
          allowDecimal={false}
          value={form.ordering}
          onChange={(ordering) => {
            onChange({ ordering });
          }}
        />
      </Stack>
    </Card>
  );
}
