import { Trans } from "@lingui/react/macro";
import { getEvents } from "@/api/events";
import { DefinitionList } from "@/features/config/automation/DefinitionList";
import {
  eventRequest,
  readEventForm
} from "@/features/config/automation/definitionForm";
import { eventDefinitionApi } from "@/features/config/automation/useDefinitionMutations";

export function EventListPage() {
  return (
    <DefinitionList
      kind="events"
      api={eventDefinitionApi}
      load={getEvents}
      request={(event) => eventRequest(readEventForm(event), event.id)}
      columns={[
        {
          key: "event",
          header: <Trans>Events</Trans>,
          render: (event) => event.event.join(", ")
        },
        {
          key: "handlermodule",
          header: <Trans>Handlermodule</Trans>,
          render: (event) => event.handlermodule
        },
        {
          key: "position",
          header: <Trans>Position</Trans>,
          render: (event) => event.position
        },
        {
          key: "conditions",
          header: <Trans>Conditions</Trans>,
          render: (event) =>
            Object.entries(event.conditions)
              .map(([key, value]) => `${key}=${value}`)
              .join(", ")
        },
        {
          key: "action",
          header: <Trans>Action</Trans>,
          render: (event) => event.action
        },
        {
          key: "options",
          header: <Trans>Options</Trans>,
          render: (event) =>
            Object.entries(event.options)
              .map(([key, value]) => `${key}=${value}`)
              .join(", ")
        }
      ]}
    />
  );
}
