import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { EventActionCard } from "./EventActionCard";
import { EventConditionsEditor } from "./EventConditionsEditor";
import { EventFormHeader } from "./EventFormHeader";
import { EventGeneralCard } from "./EventGeneralCard";
import { useEventForm } from "./useEventForm";
import type { EventHandlerDefinition } from "@/api/events";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { Card } from "@/components/layout/Card";

/** Create/edit form; `key` on the caller remounts it so state resets per handler. */
export function EventForm({
  existing
}: {
  existing: EventHandlerDefinition | undefined;
}) {
  const { canWrite, change, finish, form, lookups, mutations, options, submit, valid } =
    useEventForm(existing);
  const { actions, conditions } = lookups;
  const { dialog, requestDelete } = useDeleteConfirmation();

  return (
    <>
      <EventFormHeader
        canWrite={canWrite}
        existing={existing}
        mutations={mutations}
        requestDelete={requestDelete}
        onDeleted={finish}
      />

      <ErrorAlert error={lookups.error ?? mutations.error} />

      <form onSubmit={submit}>
        <fieldset
          disabled={!canWrite || mutations.busy}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <EventGeneralCard
            form={form}
            onChange={change}
            events={lookups.events.data ?? []}
            modules={lookups.modules.data ?? []}
            positions={lookups.positions.data ?? []}
            positionsReady={lookups.positions.isSuccess}
          />

          {lookups.pending ? <LoadingIndicator /> : null}

          {conditions.data ? (
            <Card title={<Trans>Conditions</Trans>}>
              <EventConditionsEditor
                key={form.handlermodule}
                definitions={conditions.data}
                values={form.conditions}
                onChange={(values) => {
                  change({ conditions: values });
                }}
              />
            </Card>
          ) : null}

          <EventActionCard
            form={form}
            onChange={change}
            actionNames={Object.keys(actions.data ?? {})}
            actionsReady={actions.isSuccess}
            options={options}
          />

          {canWrite ? (
            <Button
              type="submit"
              disabled={!valid}
              loading={mutations.save.isPending}
              leftSection={<IconDeviceFloppy aria-hidden size={16} />}
            >
              <Trans>Save Event Handler Definition</Trans>
            </Button>
          ) : null}
        </fieldset>
      </form>

      {dialog}
    </>
  );
}
