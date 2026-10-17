import { PeriodicTaskEditPage } from "./PeriodicTaskEditPage";
import { PeriodicTaskListPage } from "./PeriodicTaskListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

export const periodicTaskConfigRoutes: ConfigRouteDefinition[] = [
  {
    path: "periodictasks",
    element: <PeriodicTaskListPage />
  },
  {
    path: "periodictasks/list",
    element: <PeriodicTaskListPage />
  },
  {
    path: "periodictasks/add",
    element: <PeriodicTaskEditPage />
  },
  {
    path: "periodictasks/details/:ptaskid",
    element: <PeriodicTaskEditPage />
  }
];
