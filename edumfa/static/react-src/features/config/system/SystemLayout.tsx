import { Trans } from "@lingui/react/macro";
import { Divider, NavLink, Stack } from "@mantine/core";
import {
  IconBookmark,
  IconDeviceMobile,
  IconDownload,
  IconInfoCircle,
  IconMail,
  IconPower,
  IconTag,
  IconServer2,
  IconTool,
  IconMessageCog
} from "@tabler/icons-react";
import type { PropsWithChildren, ReactNode } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";

export type SystemSidebarItem =
  | "caconnectors"
  | "documentation"
  | "edumfaserver"
  | "radius"
  | "serviceid"
  | "smsgateway"
  | "smtp"
  | "system"
  | "tokengroup";

export interface SystemLayoutProps {
  activeItem: SystemSidebarItem;
}

interface ServerSection {
  addLabel: ReactNode;
  addRight: string;
  docsPath: string | null;
  helpLabel: ReactNode;
  icon: typeof IconMail;
  key: Exclude<SystemSidebarItem, "caconnectors" | "documentation" | "system">;
  label: ReactNode;
  listLabel: ReactNode;
  readRight: string;
}

const serverSections: ServerSection[] = [
  {
    addLabel: <Trans>New SMTP server</Trans>,
    addRight: "smtpserver_write",
    docsPath: "configuration/smtpserver_config.html",
    helpLabel: <Trans>Help about SMTP-Servers</Trans>,
    icon: IconMail,
    key: "smtp",
    label: <Trans>SMTP servers</Trans>,
    listLabel: <Trans>List SMTP server definitions</Trans>,
    readRight: "smtpserver_read"
  },
  {
    addLabel: <Trans>New RADIUS server</Trans>,
    addRight: "radiusserver_write",
    docsPath: "configuration/radiusserver_config.html",
    helpLabel: <Trans>Help about RADIUS-Server</Trans>,
    icon: IconPower,
    key: "radius",
    label: <Trans>RADIUS servers</Trans>,
    listLabel: <Trans>List RADIUS server definitions</Trans>,
    readRight: "radiusserver_read"
  },
  {
    addLabel: <Trans>New eduMFA server</Trans>,
    addRight: "edumfaserver_write",
    docsPath: null,
    helpLabel: null,
    icon: IconServer2,
    key: "edumfaserver",
    label: <Trans>eduMFA servers</Trans>,
    listLabel: <Trans>List eduMFA server definitions</Trans>,
    readRight: "edumfaserver_read"
  },
  {
    addLabel: <Trans>Create new SMS Gateway definition</Trans>,
    addRight: "smsgateway_write",
    docsPath: "configuration/sms_gateway_config.html",
    helpLabel: <Trans>Help about SMS-Gateways</Trans>,
    icon: IconMessageCog,
    key: "smsgateway",
    label: <Trans>SMS Gateways</Trans>,
    listLabel: <Trans>All SMS Gateways</Trans>,
    readRight: "smsgateway_read"
  },
  {
    addLabel: <Trans>New Tokengroup definition</Trans>,
    addRight: "tokengroup_add",
    docsPath: "configuration/tokengroups.html",
    helpLabel: <Trans>Help on Tokengroups</Trans>,
    icon: IconDeviceMobile,
    key: "tokengroup",
    label: <Trans>Tokengroups</Trans>,
    listLabel: <Trans>List Tokengroup definitions</Trans>,
    readRight: "tokengroup_list"
  },
  {
    addLabel: <Trans>New Service ID definition</Trans>,
    addRight: "serviceid_add",
    docsPath: "configuration/serviceids.html",
    helpLabel: <Trans>Help on Service IDs</Trans>,
    icon: IconTag,
    key: "serviceid",
    label: <Trans>Service IDs</Trans>,
    listLabel: <Trans>List Service ID definitions</Trans>,
    readRight: "serviceid_list"
  }
];

/** The CA connector types the backend ships (`get_caconnector_types`). */
const caConnectorTypes = ["local", "microsoft"];

/**
 * Port of `config.system.html`: the sidebar of the system area with the
 * server definitions, token groups, service IDs and CA connectors, each
 * with its list, "new" and help entries, plus the routed page next to it.
 */
export function SystemLayout({
  activeItem,
  children
}: PropsWithChildren<SystemLayoutProps>) {
  const { rights } = useAuth();

  return (
    <SidebarLayout
      sidebar={
        <Stack gap={2}>
          <NavLink
            active={activeItem === "system"}
            component="a"
            href={hashHref("/config/system/edit")}
            label={<Trans>System Config</Trans>}
            leftSection={<IconTool size={16} />}
          />
          {hasRight(rights, "system_documentation") ? (
            <NavLink
              active={activeItem === "documentation"}
              component="a"
              href={hashHref("/config/system/documentation")}
              label={<Trans>Get System Documentation</Trans>}
              leftSection={<IconDownload size={16} />}
            />
          ) : null}
          {serverSections
            .filter((section) => hasRight(rights, section.readRight))
            .map((section) => (
              <ServerSectionLinks
                active={activeItem === section.key}
                canAdd={hasRight(rights, section.addRight)}
                key={section.key}
                section={section}
              />
            ))}
          <NavLink
            active={activeItem === "caconnectors"}
            component="a"
            href={hashHref("/config/caconnectors/list")}
            label={<Trans>CAs</Trans>}
            leftSection={<IconBookmark size={16} />}
          />
          {activeItem === "caconnectors" ? (
            <Stack gap={2} pl="md">
              <NavLink
                component="a"
                href={hashHref("/config/caconnectors/list")}
                label={<Trans>All CA Connectors</Trans>}
              />
              {hasRight(rights, "caconnectorwrite")
                ? caConnectorTypes.map((connectorType) => (
                    <NavLink
                      component="a"
                      href={hashHref(`/config/caconnectors/${connectorType}`)}
                      key={connectorType}
                      label={
                        <Trans>New {connectorType.toUpperCase()} CA Connector</Trans>
                      }
                    />
                  ))
                : null}
            </Stack>
          ) : null}
        </Stack>
      }
    >
      {children}
    </SidebarLayout>
  );
}

interface ServerSectionLinksProps {
  active: boolean;
  canAdd: boolean;
  section: ServerSection;
}

function ServerSectionLinks({ active, canAdd, section }: ServerSectionLinksProps) {
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
