import { Trans } from "@lingui/react/macro";
import { Anchor, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { hashHref } from "@/lib/hashbang";

export interface ServiceIdListHeaderProps {
  canAdd: boolean;
}

/** The title, the explanation and the "new definition" button of the service ID list. */
export function ServiceIdListHeader({ canAdd }: ServiceIdListHeaderProps) {
  return (
    <PageHeader
      actions={
        canAdd ? (
          <Button
            component="a"
            href={hashHref("/config/serviceid/edit")}
            leftSection={<IconPlus size={16} />}
            variant="light"
          >
            <Trans>New Service ID definition</Trans>
          </Button>
        ) : null
      }
      subtitle={
        <Trans>
          Service IDs can be used to attach e.g. SSH keys to certain machines and
          services. To view attached tokens go to{" "}
          <Anchor href={hashHref("/token/applications/ssh")} inherit>
            token applications
          </Anchor>
          .
        </Trans>
      }
      title={<Trans>Service IDs</Trans>}
    />
  );
}
