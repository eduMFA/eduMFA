import { CaConnectorListPage } from "./CaConnectorListPage";
import { LocalCaConnectorPage } from "./LocalCaConnectorPage";
import { MicrosoftCaConnectorPage } from "./MicrosoftCaConnectorPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/** The legacy `config.caconnectors.*` states; the bare path redirected to the list. */
export const caConnectorConfigRoutes: ConfigRouteDefinition[] = [
  { element: <CaConnectorListPage />, path: "caconnectors" },
  { element: <CaConnectorListPage />, path: "caconnectors/list" },
  { element: <LocalCaConnectorPage />, path: "caconnectors/local" },
  { element: <LocalCaConnectorPage />, path: "caconnectors/local/:connectorname" },
  { element: <MicrosoftCaConnectorPage />, path: "caconnectors/microsoft" },
  {
    element: <MicrosoftCaConnectorPage />,
    path: "caconnectors/microsoft/:connectorname"
  }
];
