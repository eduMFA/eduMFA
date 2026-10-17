import { Trans } from "@lingui/react/macro";
import { Box, Group, NavLink, Paper } from "@mantine/core";
import {
  IconBolt,
  IconBriefcase,
  IconCalendarTime,
  IconDeviceMobile,
  IconServer,
  IconShieldCheck,
  IconUsers,
  IconWorld
} from "@tabler/icons-react";
import type { PropsWithChildren, ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { hashHref } from "@/lib/hashbang";

interface ConfigSection {
  /** Route prefixes that mark the section as active. */
  activePrefixes: string[];
  href: string;
  icon: typeof IconBriefcase;
  label: ReactNode;
  /** The rights of which one suffices to show the section (legacy `checkRight` chains). */
  rights: string[] | null;
}

const sections: ConfigSection[] = [
  {
    activePrefixes: [
      "/config/system",
      "/config/smtp",
      "/config/radius",
      "/config/edumfaserver",
      "/config/smsgateway",
      "/config/tokengroup",
      "/config/caconnectors",
      "/config/serviceid"
    ],
    href: "/config/system/edit",
    icon: IconBriefcase,
    label: <Trans>System</Trans>,
    rights: null
  },
  {
    activePrefixes: ["/config/policies"],
    href: "/config/policies/list",
    icon: IconShieldCheck,
    label: <Trans>Policies</Trans>,
    rights: ["policyread", "policywrite", "policydelete"]
  },
  {
    activePrefixes: ["/config/events"],
    href: "/config/events/list",
    icon: IconBolt,
    label: <Trans>Events</Trans>,
    rights: ["eventhandling_read", "eventhandling_write"]
  },
  {
    activePrefixes: ["/config/periodictasks"],
    href: "/config/periodictasks/list",
    icon: IconCalendarTime,
    label: <Trans>Periodic Tasks</Trans>,
    rights: ["periodictask_read", "periodictask_write"]
  },
  {
    activePrefixes: ["/config/tokens"],
    href: "/config/tokens/hotp",
    icon: IconDeviceMobile,
    label: <Trans>Tokens</Trans>,
    rights: ["configread", "configwrite"]
  },
  {
    activePrefixes: ["/config/machineresolvers"],
    href: "/config/machineresolvers/list",
    icon: IconServer,
    label: <Trans>Machines</Trans>,
    rights: ["mresolverread", "mresolverwrite", "mresolverdelete"]
  },
  {
    activePrefixes: ["/config/resolvers"],
    href: "/config/resolvers/list",
    icon: IconUsers,
    label: <Trans>Users</Trans>,
    rights: ["resolverread", "resolverwrite", "resolverdelete"]
  },
  {
    activePrefixes: ["/config/realms"],
    href: "/config/realms/list",
    icon: IconWorld,
    label: <Trans>Realms</Trans>,
    rights: ["resolverread", "resolverwrite", "resolverdelete"]
  }
];

/**
 * Port of `config.html`: the second-level navigation of the config area
 * (System, Policies, Events, ...). Every config page renders inside it, so
 * pages return their content without the outer shell box.
 */
export function ConfigLayout({ children }: PropsWithChildren) {
  const { rights } = useAuth();
  const { pathname } = useLocation();
  const visibleSections = sections.filter(
    (section) =>
      section.rights === null || section.rights.some((right) => hasRight(rights, right))
  );

  return (
    <Box className="react-migration-shell">
      <Paper
        className="config-section-navigation"
        component="nav"
        mb="xl"
        p={6}
        radius="lg"
        shadow="xs"
        withBorder
      >
        <Group gap={4} wrap="wrap">
          {visibleSections.map((section) => {
            const Icon = section.icon;

            return (
              <NavLink
                active={section.activePrefixes.some((prefix) =>
                  pathname.startsWith(prefix)
                )}
                component="a"
                href={hashHref(section.href)}
                key={section.href}
                label={section.label}
                leftSection={<Icon size={16} />}
                className="config-section-link"
                style={{ width: "auto" }}
              />
            );
          })}
        </Group>
      </Paper>
      {children}
    </Box>
  );
}
