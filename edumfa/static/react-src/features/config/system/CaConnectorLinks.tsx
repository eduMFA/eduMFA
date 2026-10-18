import { Trans, useLingui } from "@lingui/react/macro";
import { NavLink, Stack } from "@mantine/core";
import { IconBookmark } from "@tabler/icons-react";

import { caConnectorTypes } from "./systemSections";
import { hashHref } from "@/lib/hashbang";

/** The CA connectors entry of the sidebar; the list and "new" links unfold while active. */
export function CaConnectorLinks({
  active,
  canAdd
}: {
  active: boolean;
  canAdd: boolean;
}) {
  const { t } = useLingui();

  return (
    <>
      <NavLink
        active={active}
        component="a"
        href={hashHref("/config/caconnectors/list")}
        label={t`CAs`}
        leftSection={<IconBookmark size={16} />}
      />
      {active ? (
        <Stack gap={2} pl="md">
          <NavLink
            component="a"
            href={hashHref("/config/caconnectors/list")}
            label={t`All CA Connectors`}
          />
          {canAdd
            ? caConnectorTypes.map((connectorType) => (
                <NavLink
                  component="a"
                  href={hashHref(`/config/caconnectors/${connectorType}`)}
                  key={connectorType}
                  label={<Trans>New {connectorType.toUpperCase()} CA Connector</Trans>}
                />
              ))
            : null}
        </Stack>
      ) : null}
    </>
  );
}
