import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { Route, Routes } from "react-router-dom";

import { ConfigLayout } from "@/features/config/ConfigLayout";
import { configRouteTable } from "@/features/config/configRouteTable";

/**
 * The `/config/*` pages inside the configuration layout. A path without a
 * page gets a notice instead of the redirect to the system settings.
 */
export function ConfigRoutes() {
  return (
    <ConfigLayout>
      <Routes>
        {configRouteTable.map((route) => (
          <Route element={route.element} key={route.path} path={route.path} />
        ))}
        <Route
          path="*"
          element={
            <Alert color="yellow" role="alert" variant="light">
              <Trans>This configuration page is not available yet.</Trans>
            </Alert>
          }
        />
      </Routes>
    </ConfigLayout>
  );
}
