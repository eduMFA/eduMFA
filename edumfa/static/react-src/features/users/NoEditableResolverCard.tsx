import { Trans } from "@lingui/react/macro";
import { Anchor, Text } from "@mantine/core";

import { Card } from "@/components/layout/Card";
import { hashHref } from "@/lib/hashbang";

/** Shown instead of the form when no resolver allows writing users. */
export function NoEditableResolverCard() {
  return (
    <Card>
      <Text size="sm">
        <Trans>
          You have no editable resolvers defined. So you can not write to any user
          store. If you want to add users, you need to{" "}
          <Anchor href={hashHref("/config/resolvers/list")} size="sm">
            define an editable resolver
          </Anchor>{" "}
          (like SQLResolver) and check the box "Edit user store".
        </Trans>
      </Text>
    </Card>
  );
}
