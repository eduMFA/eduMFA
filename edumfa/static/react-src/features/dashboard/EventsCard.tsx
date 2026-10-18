import { Trans } from "@lingui/react/macro";
import { Table } from "@mantine/core";

import { LinkListRow } from "./LinkListRow";
import { StatRow } from "./StatRow";
import type { EventSummary } from "@/api/config";
import { Card } from "@/components/layout/Card";
import { hashHref } from "@/lib/hashbang";

export interface EventsCardProps {
  activeEvents: EventSummary[];
  inactiveEvents: EventSummary[];
}

/** Active and inactive event handler counts, each followed by the event links. */
export function EventsCard({ activeEvents, inactiveEvents }: EventsCardProps) {
  return (
    <Card flush title={<Trans>Events</Trans>}>
      <Table verticalSpacing="xs">
        <Table.Tbody>
          <StatRow label={<Trans>Active Events</Trans>} name="activeEvents">
            {activeEvents.length}
          </StatRow>
          <LinkListRow links={activeEvents.map(toEventLink)} />
          <StatRow label={<Trans>Inactive Events</Trans>} name="inactiveEvents">
            {inactiveEvents.length}
          </StatRow>
          <LinkListRow links={inactiveEvents.map(toEventLink)} />
        </Table.Tbody>
      </Table>
    </Card>
  );
}

function toEventLink(event: EventSummary) {
  return {
    href: hashHref(`/config/events/details/${String(event.id)}`),
    key: String(event.id),
    label: event.name
  };
}
