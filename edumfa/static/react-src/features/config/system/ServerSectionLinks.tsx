import { Divider, NavLink, Stack } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import type { ServerSection } from "./systemSections";
import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";

interface ServerSectionLinksProps {
  active: boolean;
  canAdd: boolean;
  section: ServerSection;
}

/** The sidebar entry of one server section; the list, "new" and help links unfold while active. */
export function ServerSectionLinks({
  active,
  canAdd,
  section
}: ServerSectionLinksProps) {
  const Icon = section.icon;
  const docsUrl = useDocsUrl(section.docsPath ?? "");

  return (
    <>
      <NavLink
        active={active}
        component="a"
        href={hashHref(`/config/${section.key}/list`)}
        label={section.label}
        leftSection={<Icon size={16} />}
      />
      {active ? (
        <Stack gap={2} pl="md">
          <NavLink
            component="a"
            href={hashHref(`/config/${section.key}/list`)}
            label={section.listLabel}
          />
          {canAdd ? (
            <NavLink
              component="a"
              href={hashHref(`/config/${section.key}/edit`)}
              label={section.addLabel}
            />
          ) : null}
          {section.docsPath ? (
            <>
              <Divider my={4} />
              <NavLink
                component="a"
                href={docsUrl}
                label={section.helpLabel}
                leftSection={<IconInfoCircle size={16} />}
                rel="noopener"
                target="_blank"
              />
            </>
          ) : null}
        </Stack>
      ) : null}
    </>
  );
}
