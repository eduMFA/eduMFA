import { useLingui } from "@lingui/react/macro";
import { getEvents } from "@/api/events";
import { DefinitionList } from "@/features/config/automation/DefinitionList";
import {
  eventRequest,
  readEventForm
} from "@/features/config/automation/definitionForm";
import { eventDefinitionApi } from "@/features/config/automation/useDefinitionMutations";

export function EventListPage() {
  const { t } = useLingui();

  return (
    <DefinitionList
      kind="events"
      api={eventDefinitionApi}
      load={getEvents}
      request={(event) => eventRequest(readEventForm(event), event.id)}
      columns={[
        {
          key: "event",
          header: t`Events`,
          render: (event) => event.event.join(", ")
        },
        {
          key: "handlermodule",
          header: t`Handlermodule`,
          render: (event) => event.handlermodule
        },
        {
          key: "position",
          header: t`Position`,
          render: (event) => event.position
        },
        {
          key: "conditions",
          header: t`Conditions`,
          render: (event) =>
            Object.entries(event.conditions)
              .map(([key, value]) => `${key}=${value}`)
              .join(", ")
        },
        {
          key: "action",
          header: t`Action`,
          render: (event) => event.action
        },
        {
          key: "options",
          header: t`Options`,
          render: (event) =>
            Object.entries(event.options)
              .map(([key, value]) => `${key}=${value}`)
              .join(", ")
        }
      ]}
    />
  );
}
