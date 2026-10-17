import { EventEditPage } from "./EventEditPage";
import { EventListPage } from "./EventListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

export const eventConfigRoutes: ConfigRouteDefinition[] = [
  {
    path: "events",
    element: <EventListPage />
  },
  {
    path: "events/list",
    element: <EventListPage />
  },
  {
    path: "events/add",
    element: <EventEditPage />
  },
  {
    path: "events/details/:eventid",
    element: <EventEditPage />
  }
];
