import { EduMfaServerEditPage } from "./edumfaserver/EduMfaServerEditPage";
import { EduMfaServerListPage } from "./edumfaserver/EduMfaServerListPage";
import { RadiusServerEditPage } from "./radius/RadiusServerEditPage";
import { RadiusServerListPage } from "./radius/RadiusServerListPage";
import { SmsGatewayEditPage } from "./smsgateway/SmsGatewayEditPage";
import { SmsGatewayListPage } from "./smsgateway/SmsGatewayListPage";
import { SmtpServerEditPage } from "./smtp/SmtpServerEditPage";
import { SmtpServerListPage } from "./smtp/SmtpServerListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/**
 * The server definitions of the system area (`config.smtp.*`,
 * `config.radius.*`, `config.edumfaserver.*`, `config.smsgateway.*`),
 * relative to `/config`. The bare area paths serve the list like the
 * legacy controllers' redirect.
 */
export const serverConfigRoutes: ConfigRouteDefinition[] = [
  { element: <SmtpServerListPage />, path: "smtp" },
  { element: <SmtpServerListPage />, path: "smtp/list" },
  { element: <SmtpServerEditPage />, path: "smtp/edit" },
  { element: <SmtpServerEditPage />, path: "smtp/edit/:identifier" },
  { element: <RadiusServerListPage />, path: "radius" },
  { element: <RadiusServerListPage />, path: "radius/list" },
  { element: <RadiusServerEditPage />, path: "radius/edit" },
  { element: <RadiusServerEditPage />, path: "radius/edit/:identifier" },
  { element: <EduMfaServerListPage />, path: "edumfaserver" },
  { element: <EduMfaServerListPage />, path: "edumfaserver/list" },
  { element: <EduMfaServerEditPage />, path: "edumfaserver/edit" },
  { element: <EduMfaServerEditPage />, path: "edumfaserver/edit/:identifier" },
  { element: <SmsGatewayListPage />, path: "smsgateway" },
  { element: <SmsGatewayListPage />, path: "smsgateway/list" },
  { element: <SmsGatewayEditPage />, path: "smsgateway/edit" },
  { element: <SmsGatewayEditPage />, path: "smsgateway/edit/:gateway_id" }
];
