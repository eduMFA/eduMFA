import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Button,
  Checkbox,
  NativeSelect,
  NumberInput,
  Stack,
  TextInput
} from "@mantine/core";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EventConditionsEditor } from "./EventConditionsEditor";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  eventQueryKeys,
  getEvent,
  getAvailableEvents,
  getEventHandlerModules,
  getHandlerActions,
  getHandlerConditions,
  getHandlerPositions,
  type EventHandlerDefinition
} from "@/api/events";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { CheckboxPickList } from "@/components/forms/CheckboxPickList";
import { TypedOptionsTable } from "@/components/forms/TypedOptionsTable";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  DefinitionLayout,
  DefinitionPermissionAlert
} from "@/features/config/automation/DefinitionLayout";
import {
  choicesWithCurrent,
  eventRequest,
  readEventForm,
  optionEntries,
  validOptions,
  validOrder,
  type EventForm as EventFormValues
} from "@/features/config/automation/definitionForm";
import {
  eventDefinitionApi,
  useDefinitionMutations
} from "@/features/config/automation/useDefinitionMutations";
import { pushFlash } from "@/lib/flash";

type FormChange = (patch: Partial<EventFormValues>) => void;

/** Route entry: loads the handler (when editing) and checks permissions before rendering the form. */
export function EventEditPage() {
  const { eventid } = useParams();
  const client = useApiClient();
  const { rights, isAuthenticated } = useAuth();
  const allowed =
    isAuthenticated &&
    hasRight(rights, eventid ? "eventhandling_read" : "eventhandling_write");

  const query = useQuery({
    queryKey: eventQueryKeys.detail(eventid ?? ""),
    queryFn: ({ signal }) => getEvent(client, eventid ?? "", signal),
    enabled: allowed && Boolean(eventid)
  });
  const existing = query.data?.[0];

  return (
    <DefinitionLayout kind="events">
      {!allowed ? (
        <DefinitionPermissionAlert />
      ) : (
        <>
          <ErrorAlert error={query.error} />
          {query.isLoading ? <LoadingIndicator /> : null}

          {eventid && query.isSuccess && !existing ? (
            <Alert color="yellow" role="alert">
              <Trans>The event handler does not exist.</Trans>
            </Alert>
          ) : null}

          {!eventid || existing ? (
            <EventForm key={eventid ?? "new"} existing={existing} />
          ) : null}
        </>
      )}
    </DefinitionLayout>
  );
}

/** Create/edit form; `key` on the caller remounts it so state resets per handler. */
function EventForm({ existing }: { existing: EventHandlerDefinition | undefined }) {
  const client = useApiClient();
  const { t } = useLingui();
  const navigate = useNavigate();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "eventhandling_write");

  const [form, setForm] = useState(() => readEventForm(existing));
  const change: FormChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };
  const mutations = useDefinitionMutations(eventDefinitionApi);
  const { dialog, requestDelete } = useDeleteConfirmation();

  // Lookup data; actions, conditions and positions depend on the chosen module.
  const events = useQuery({
    queryKey: eventQueryKeys.availableEvents,
    queryFn: ({ signal }) => getAvailableEvents(client, signal)
  });
  const modules = useQuery({
    queryKey: eventQueryKeys.handlerModules,
    queryFn: ({ signal }) => getEventHandlerModules(client, signal)
  });
  const actions = useQuery({
    queryKey: eventQueryKeys.actions(form.handlermodule),
    queryFn: ({ signal }) => getHandlerActions(client, form.handlermodule, signal),
    enabled: Boolean(form.handlermodule)
  });
  const conditions = useQuery({
    queryKey: eventQueryKeys.conditions(form.handlermodule),
    queryFn: ({ signal }) => getHandlerConditions(client, form.handlermodule, signal),
    enabled: Boolean(form.handlermodule)
  });
  const positions = useQuery({
    queryKey: eventQueryKeys.positions(form.handlermodule),
    queryFn: ({ signal }) => getHandlerPositions(client, form.handlermodule, signal),
    enabled: Boolean(form.handlermodule)
  });

  const specs = actions.data?.[form.action] ?? {};
  // Hide options whose `visibleIf` option does not currently have the required value.
  const options = optionEntries(specs, form.options).filter(([name]) => {
    const spec = specs[name];
    return (
      !spec?.visibleIf ||
      String(form.options[spec.visibleIf] ?? "") === String(spec.visibleValue)
    );
  });
  const selectedConditions = Object.entries(conditions.data ?? {}).filter(
    ([name]) => name in form.conditions
  );

  // Saving is blocked until all lookup data has loaded.
  const ready =
    events.isSuccess &&
    modules.isSuccess &&
    actions.isSuccess &&
    conditions.isSuccess &&
    positions.isSuccess;
  const valid =
    ready &&
    form.name.trim() &&
    form.event.length &&
    form.handlermodule &&
    form.action &&
    form.position &&
    validOrder(form.ordering) &&
    validOptions(options, form.options) &&
    validOptions(selectedConditions, form.conditions);

  const finish = () => {
    void navigate("/config/events/list");
  };

  return (
    <>
      <PageHeader
        title={
          existing ? (
            <Trans>Edit Event Handler {existing.id}</Trans>
          ) : (
            <Trans>Create a new Event Handler</Trans>
          )
        }
        actions={
          existing && canWrite ? (
            <Button
              color="red"
              variant="light"
              leftSection={<IconTrash aria-hidden size={16} />}
              disabled={mutations.busy}
              onClick={() => {
                requestDelete({
                  identifier: existing.name,
                  question: <Trans>Do you really want to delete this event?</Trans>,
                  onConfirm: () => {
                    mutations.remove.mutate(existing.id, { onSuccess: finish });
                  }
                });
              }}
            >
              <Trans>Delete</Trans>
            </Button>
          ) : null
        }
      />

      <ErrorAlert
        error={
          events.error ??
          modules.error ??
          actions.error ??
          conditions.error ??
          positions.error ??
          mutations.error
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canWrite && valid && !mutations.busy)
            mutations.save.mutate(eventRequest(form, existing?.id), {
              onSuccess: () => {
                pushFlash(t`Event handler saved.`, "info");
                finish();
              }
            });
        }}
      >
        <fieldset
          disabled={!canWrite || mutations.busy}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <EventGeneralCard
            form={form}
            onChange={change}
            events={events.data ?? []}
            modules={modules.data ?? []}
            positions={positions.data ?? []}
            positionsReady={positions.isSuccess}
          />

          {form.handlermodule &&
          !ready &&
          !actions.error &&
          !conditions.error &&
          !positions.error ? (
            <LoadingIndicator />
          ) : null}

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

/** Name, status, triggering events, handler module, position and order of a handler. */
function EventGeneralCard({
  form,
  onChange,
  events,
  modules,
  positions,
  positionsReady
}: {
  form: EventFormValues;
  onChange: FormChange;
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

/** Action choice plus the options that action accepts. */
function EventActionCard({
  form,
  onChange,
  actionNames,
  actionsReady,
  options
}: {
  form: EventFormValues;
  onChange: FormChange;
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
