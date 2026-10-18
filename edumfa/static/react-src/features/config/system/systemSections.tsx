import { Trans } from "@lingui/react/macro";
import {
  IconDeviceMobile,
  IconMail,
  IconPower,
  IconTag,
  IconServer2,
  IconMessageCog
} from "@tabler/icons-react";
import type { ReactNode } from "react";

/** The server-like sections of the sidebar, each with list, "new" and help links. */
export type ServerSectionKey =
  "edumfaserver" | "radius" | "serviceid" | "smsgateway" | "smtp" | "tokengroup";

export interface ServerSection {
  addLabel: ReactNode;
  addRight: string;
  docsPath: string | null;
  helpLabel: ReactNode;
  icon: typeof IconMail;
  key: ServerSectionKey;
  label: ReactNode;
  listLabel: ReactNode;
  readRight: string;
}

export const serverSections: ServerSection[] = [
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
export const caConnectorTypes = ["local", "microsoft"];
