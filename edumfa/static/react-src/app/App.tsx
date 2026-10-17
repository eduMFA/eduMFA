import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@lingui/react";
import { useEffect, useMemo, useState } from "react";

import {
  normalizeHashRoute,
  readReactBootstrapConfig,
  type ReactBootstrapConfig
} from "./bootstrap";
import { HashbangRouter } from "./HashbangRouter";
import { i18n } from "./i18n";
import { createEduMfaQueryClient } from "./queryClient";
import { MigratedRoutes, shouldReactOwnRoute } from "./routes";
import { theme } from "./theme";
import { ApiClientProvider } from "@/api/ApiClientProvider";
import { AuthProvider } from "@/auth/AuthProvider";

export function App() {
  const bootstrapConfig = useMemo(() => readReactBootstrapConfig(), []);
  const [currentRoute, setCurrentRoute] = useState(() =>
    normalizeHashRoute(window.location.hash)
  );
  const [queryClient] = useState(() => createEduMfaQueryClient());
  const shouldRenderReact =
    bootstrapConfig.enabled &&
    shouldReactOwnRoute(currentRoute, bootstrapConfig.routes);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(normalizeHashRoute(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    return toggleShellVisibility(bootstrapConfig, shouldRenderReact);
  }, [bootstrapConfig, shouldRenderReact]);

  if (!shouldRenderReact) {
    return null;
  }

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <I18nProvider i18n={i18n}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ApiClientProvider>
              <HashbangRouter>
                <MigratedRoutes />
              </HashbangRouter>
            </ApiClientProvider>
          </QueryClientProvider>
        </AuthProvider>
      </I18nProvider>
    </MantineProvider>
  );
}

function toggleShellVisibility(
  config: ReactBootstrapConfig,
  useReactShell: boolean
): () => void {
  const reactRoot = document.getElementById(config.mountId);
  const angularRoot = document.getElementById(config.angularRootId);

  setElementHidden(reactRoot, !useReactShell);
  setElementHidden(angularRoot, useReactShell);

  return () => {
    setElementHidden(reactRoot, true);
    setElementHidden(angularRoot, false);
  };
}

function setElementHidden(element: HTMLElement | null, hidden: boolean): void {
  if (element) {
    element.hidden = hidden;
  }
}
