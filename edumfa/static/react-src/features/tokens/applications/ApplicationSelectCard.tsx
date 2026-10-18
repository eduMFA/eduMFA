import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, NativeSelect, Text } from "@mantine/core";

import { type ApplicationName } from "./types";
import { Card } from "@/components/layout/Card";
import { hashHref } from "@/lib/hashbang";

export interface ApplicationSelectCardProps {
  application: ApplicationName;
  onChange: (application: string) => void;
}

/** Switches between the applications; the SSH view links to the service ID config. */
export function ApplicationSelectCard({
  application,
  onChange
}: ApplicationSelectCardProps) {
  const { t } = useLingui();

  return (
    <Card>
      <NativeSelect
        data={[
          { label: t`SSH: Attaching ssh keys to services.`, value: "ssh" },
          {
            label: t`offline: Use HOTP token for offline login to notebooks.`,
            value: "offline"
          }
        ]}
        id="token_application"
        label={<Trans>Application</Trans>}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        value={application}
      />
      {application === "ssh" ? (
        <Text mt="sm" size="sm">
          <Trans>
            To define service IDs go to{" "}
            <Anchor href={hashHref("/config/serviceid")} size="sm">
              Service ID config
            </Anchor>
          </Trans>
        </Text>
      ) : null}
    </Card>
  );
}
